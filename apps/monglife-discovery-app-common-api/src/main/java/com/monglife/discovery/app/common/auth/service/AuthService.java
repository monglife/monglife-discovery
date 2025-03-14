package com.monglife.discovery.app.common.auth.service;

import com.monglife.core.enums.role.RoleCode;
import com.monglife.core.vo.passport.PassportDataAccountVo;
import com.monglife.core.vo.passport.PassportDataAppVersionVo;
import com.monglife.discovery.app.common.auth.dto.etc.LoginDto;
import com.monglife.discovery.app.common.auth.dto.etc.LogoutDto;
import com.monglife.discovery.app.common.auth.dto.etc.ReissueDto;
import com.monglife.discovery.app.common.auth.dto.etc.VerifyAccessTokenDto;
import com.monglife.discovery.app.common.auth.exception.NeedAppUpdateException;
import com.monglife.discovery.app.common.auth.exception.TokenExpiredException;
import com.monglife.discovery.app.common.global.provider.TokenProvider;
import com.monglife.discovery.domain.account.service.AccountService;
import com.monglife.discovery.domain.account.service.LoginHistoryService;
import com.monglife.discovery.domain.account.service.TokenService;
import com.monglife.discovery.domain.account.vo.AccountVo;
import com.monglife.discovery.domain.account.vo.LoginHistoryVo;
import com.monglife.discovery.domain.account.vo.TokenVo;
import com.monglife.discovery.domain.device.service.AppVersionService;
import com.monglife.discovery.domain.device.vo.AppVersionVo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AccountService accountService;

    private final AppVersionService appVersionService;

    private final TokenService tokenService;

    private final LoginHistoryService loginHistoryService;

    private final TokenProvider tokenProvider;

    /**
     * 회원 가입
     * @param email 이메일
     * @param name 이름
     * @param socialAccountId 구글 계정 ID
     */
    @Transactional
    public void join(String email, String name, String socialAccountId) {

        AccountVo accountVo = AccountVo.builder()
                .email(email)
                .name(name)
                .socialAccountId(socialAccountId)
                .role(RoleCode.NORMAL.getRole())
                .build();

        accountService.createAccount(accountVo);
    }

    /**
     * 로그인
     * @param deviceId 기기 ID
     * @param socialAccountId 구글 계정 ID
     * @param email 이메일
     * @param appPackageName 앱 패키지 명
     * @param deviceName 기기명
     * @param buildVersion 앱 빌드 버전
     * @return 로그인 정보 Dto
     */
    @Transactional
    public LoginDto login(String deviceId, String socialAccountId, String email, String appPackageName, String deviceName, String buildVersion) {

        AppVersionVo appVersionVo = appVersionService.getAppVersion(appPackageName, buildVersion);

        // 앱 업데이트 여부 확인
        if (appVersionVo.getMustUpdate()) {
            throw new NeedAppUpdateException();
        }

        // 회원 조회
        AccountVo accountVo = accountService.getAccount(email);

        // 소셜 로그인 ID 업데이트 (이전 사용자)
        if (accountVo.getSocialAccountId().isBlank()) {
            accountService.updateSocialAccountId(accountVo.getEmail(), socialAccountId);
        }

        // 존재 세션 삭제
        tokenService.deleteToken(accountVo.getAccountId(), deviceId);

        //  RefreshToken 발급
        String refreshToken = tokenProvider.generateRefreshToken();

        // AccessToken 발급
        String accessToken = tokenProvider.generateAccessToken(accountVo.getAccountId(), deviceId, appPackageName, buildVersion);

        // 새로운 세션 등록
        tokenService.createToken(TokenVo.builder()
                .refreshToken(refreshToken)
                .deviceId(deviceId)
                .accountId(accountVo.getAccountId())
                .appPackageName(appPackageName)
                .buildVersion(buildVersion)
                .createdAt(LocalDateTime.now())
                .expiration(tokenProvider.getRefreshTokenExpiration())
                .build());

        // 로그인 카운트 1 증가
        loginHistoryService.patchLoginHistory(LoginHistoryVo.builder()
                .accountId(accountVo.getAccountId())
                .deviceId(deviceId)
                .appPackageName(appPackageName)
                .deviceName(deviceName)
                .buildVersion(buildVersion)
                .build());

        return LoginDto.builder()
                .accountId(accountVo.getAccountId())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    /**
     * 로그 아웃
     * @param refreshToken RefreshToken
     * @return 로그 아웃 정보 Dto
     */
    @Transactional
    public LogoutDto logout(String refreshToken) {

        // 존재 세션 삭제
        TokenVo tokenVo = tokenService.deleteToken(refreshToken);

        return LogoutDto.builder()
                .accountId(tokenVo.getAccountId())
                .deviceId(tokenVo.getDeviceId())
                .build();
    }

    /**
     * 토큰 재발행
     * @param refreshToken RefreshToken
     * @return 재발행 토큰 정보 Dto
     */
    @Transactional
    public ReissueDto reissue(String refreshToken) {

        // 존재 세션 삭제
        TokenVo tokenVo = tokenService.deleteToken(refreshToken);

        // RefreshToken 발급
        String newRefreshToken = tokenProvider.generateRefreshToken();

        // AccessToken 발급
        String newAccessToken = tokenProvider.generateAccessToken(
                tokenVo.getAccountId(),
                tokenVo.getDeviceId(),
                tokenVo.getAppPackageName(),
                tokenVo.getBuildVersion());

        // 새로운 세션 등록
        tokenService.createToken(TokenVo.builder()
                .refreshToken(newRefreshToken)
                .deviceId(tokenVo.getDeviceId())
                .accountId(tokenVo.getAccountId())
                .appPackageName(tokenVo.getAppPackageName())
                .buildVersion(tokenVo.getBuildVersion())
                .createdAt(LocalDateTime.now())
                .expiration(tokenProvider.getRefreshTokenExpiration())
                .build());

        return ReissueDto.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    /**
     * AccessToken 검증
     * @param accessToken AccessToken
     * @return 검증 정보 Dto
     */
    @Transactional(readOnly = true)
    public VerifyAccessTokenDto verifyAccessToken(String accessToken) {

        if (tokenProvider.isTokenExpired(accessToken)) {
            throw new TokenExpiredException(accessToken);
        }

        return VerifyAccessTokenDto.builder()
                .accessToken(accessToken)
                .build();
    }

    /**
     * 패스 포트 계정 정보 조회
     * @param accessToken AccessToken
     * @return 패스 포트 계정 정보 Vo
     */
    @Transactional(readOnly = true)
    public PassportDataAccountVo getPassportDataAccount(String accessToken) {

        if (tokenProvider.isTokenExpired(accessToken)) {
            throw new TokenExpiredException(accessToken);
        }

        Long accountId = tokenProvider.getAccountId(accessToken)
                .orElseThrow(() -> new TokenExpiredException(accessToken));

        String deviceId = tokenProvider.getDeviceId(accessToken)
                .orElseThrow(() -> new TokenExpiredException(accessToken));

        AccountVo accountVo = accountService.getAccount(accountId);

        return PassportDataAccountVo.builder()
                .accountId(accountId)
                .deviceId(deviceId)
                .email(accountVo.getEmail())
                .name(accountVo.getName())
                .role(accountVo.getRole())
                .build();
    }

    /**
     * 패스 포트 앱 버전 정보 조회
     * @param accessToken AccessToken
     * @return 패스 포트 앱 버전 정보 Vo
     */
    @Transactional(readOnly = true)
    public PassportDataAppVersionVo getPassportDataAppVersion(String accessToken) {

        if (tokenProvider.isTokenExpired(accessToken)) {
            throw new TokenExpiredException(accessToken);
        }

        String appPackageName = tokenProvider.getAppPackageName(accessToken)
                .orElseThrow(() -> new TokenExpiredException(accessToken));

        String buildVersion = tokenProvider.getBuildVersion(accessToken)
                .orElseThrow(() -> new TokenExpiredException(accessToken));

        return PassportDataAppVersionVo.builder()
                .appPackageName(appPackageName)
                .buildVersion(buildVersion)
                .build();
    }
}
