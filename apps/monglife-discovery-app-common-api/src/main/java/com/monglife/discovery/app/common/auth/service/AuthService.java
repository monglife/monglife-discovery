package com.monglife.discovery.app.common.auth.service;

import com.monglife.core.enums.role.RoleCode;
import com.monglife.core.vo.passport.PassportDataAccountVo;
import com.monglife.core.vo.passport.PassportDataAppVersionVo;
import com.monglife.discovery.app.common.auth.dto.etc.*;
import com.monglife.discovery.app.common.auth.exception.NeedUpdateAppException;
import com.monglife.discovery.app.common.auth.exception.SocialAccountMismatchException;
import com.monglife.discovery.app.common.auth.exception.TokenExpiredException;
import com.monglife.discovery.app.common.global.provider.AppleIdTokenProvider;
import com.monglife.discovery.app.common.global.provider.GoogleIdTokenProvider;
import com.monglife.discovery.app.common.global.provider.TokenProvider;
import com.monglife.discovery.app.common.global.vo.AppleIdentityVo;
import com.monglife.discovery.app.common.global.vo.GoogleIdentityVo;
import com.monglife.discovery.domain.account.service.AccountService;
import com.monglife.discovery.domain.account.service.LoginHistoryService;
import com.monglife.discovery.domain.account.service.TokenService;
import com.monglife.discovery.domain.account.enums.AccountPlatform;
import com.monglife.discovery.domain.account.vo.AccountVo;
import com.monglife.discovery.domain.account.vo.LoginHistoryVo;
import com.monglife.discovery.domain.account.vo.TokenVo;
import com.monglife.discovery.domain.device.service.AppVersionService;
import com.monglife.discovery.domain.device.vo.AppVersionVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AccountService accountService;

    private final AppVersionService appVersionService;

    private final TokenService tokenService;

    private final LoginHistoryService loginHistoryService;

    private final TokenProvider tokenProvider;

    private final GoogleIdTokenProvider googleIdTokenProvider;

    private final AppleIdTokenProvider appleIdTokenProvider;

    /**
     * 회원 가입
     * @param email 이메일
     * @param name 이름
     * @param socialAccountId 구글 계정 ID
     * @param role 권한
     */
    @Transactional
    public void join(String email, String name, String socialAccountId, String role) {
        // 구 경로. 플랫폼을 알 수 없으므로 NULL 로 둔다 (DB 기본값에 맡긴다)
        join(email, name, socialAccountId, role, null);
    }

    private void join(String email, String name, String socialAccountId, String role, AccountPlatform platform) {

        AccountVo accountVo = AccountVo.builder()
                .email(email)
                .name(name)
                .socialAccountId(socialAccountId)
                .role(role)
                .platform(platform == null ? null : platform.name())
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

        // 앱 버전 체크
        if (appVersionService.getAppVersion(appPackageName, buildVersion).getMustUpdate()) {
            throw new NeedUpdateAppException();
        }

        // 회원 조회
        AccountVo accountVo = accountService.getAccount(email);

        // 소셜 로그인 ID 업데 이트 (이전 사용자)
        if (accountVo.getSocialAccountId() == null || accountVo.getSocialAccountId().isBlank()) {
            accountService.updateSocialAccountId(accountVo.getEmail(), socialAccountId);
        }

        return issueLogin(accountVo.getAccountId(), deviceId, appPackageName, deviceName, buildVersion);
    }

    /**
     * 세션 발급 (기존 세션 삭제 -> 토큰 발급 -> 세션 등록 -> 로그인 카운트 증가)
     * @param accountId 회원 ID
     * @param deviceId 기기 ID
     * @param appPackageName 앱 패키지 명
     * @param deviceName 기기명
     * @param buildVersion 앱 빌드 버전
     * @return 로그인 정보 Dto
     */
    private LoginDto issueLogin(Long accountId, String deviceId, String appPackageName, String deviceName, String buildVersion) {

        // 존재 세션 삭제
        tokenService.deleteToken(accountId, deviceId);

        // RefreshToken 발급
        String refreshToken = tokenProvider.generateRefreshToken();

        // AccessToken 발급
        String accessToken = tokenProvider.generateAccessToken(accountId, deviceId, appPackageName, buildVersion);

        // 새로운 세션 등록
        tokenService.createToken(TokenVo.builder()
                .refreshToken(refreshToken)
                .accessToken(accessToken)
                .deviceId(deviceId)
                .accountId(accountId)
                .appPackageName(appPackageName)
                .buildVersion(buildVersion)
                .createdAt(LocalDateTime.now())
                .expiration(tokenProvider.getRefreshTokenExpiration())
                .build());

        // 로그인 카운트 1 증가
        loginHistoryService.patchLoginHistory(LoginHistoryVo.builder()
                .accountId(accountId)
                .deviceId(deviceId)
                .appPackageName(appPackageName)
                .deviceName(deviceName)
                .buildVersion(buildVersion)
                .build());

        return LoginDto.builder()
                .accountId(accountId)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    /**
     * credential 방식 로그인
     * body 가 아닌 검증된 ID 토큰의 클레임으로 계정을 특정한다.
     * @param idToken 구글 ID 토큰
     * @param socialAccountId 구글 계정 ID (토큰의 sub 와 대조용)
     * @param deviceId 기기 ID
     * @param appPackageName 앱 패키지 명
     * @param deviceName 기기명
     * @param buildVersion 앱 빌드 버전
     * @return 로그인 정보 Dto
     */
    @Transactional
    public LoginDto loginWithCredential(String idToken, String socialAccountId, String deviceId, String appPackageName, String deviceName, String buildVersion) {

        // 신뢰 경계. DB 조회보다 먼저 검증해 쓰레기 요청에 DB 를 낭비하지 않는다
        GoogleIdentityVo googleIdentityVo = googleIdTokenProvider.verify(idToken);

        // body 의 socialAccountId 는 같은 ID 토큰의 sub 여야 한다
        if (!googleIdentityVo.getSocialAccountId().equals(socialAccountId)) {
            throw new SocialAccountMismatchException();
        }

        // 앱 버전 체크
        if (appVersionService.getAppVersion(appPackageName, buildVersion).getMustUpdate()) {
            throw new NeedUpdateAppException();
        }

        // 회원 조회 (검증된 email 로)
        AccountVo accountVo = accountService.getAccount(googleIdentityVo.getEmail());

        // 소셜 로그인 ID 정합성 확인 및 업데이트 (이전 사용자)
        String storedSocialAccountId = accountVo.getSocialAccountId();

        if (storedSocialAccountId == null || storedSocialAccountId.isBlank()) {
            accountService.updateSocialAccountId(accountVo.getEmail(), googleIdentityVo.getSocialAccountId());
        } else if (!storedSocialAccountId.equals(googleIdentityVo.getSocialAccountId())) {
            // 같은 이메일을 쓰는 다른 구글 계정
            throw new SocialAccountMismatchException();
        }

        // 플랫폼 백필 (platform 컬럼 도입 전 계정)
        accountService.fillPlatformIfEmpty(accountVo.getAccountId(), AccountPlatform.GOOGLE.name());

        return issueLogin(accountVo.getAccountId(), deviceId, appPackageName, deviceName, buildVersion);
    }

    /**
     * credential 방식 회원 가입
     * @param idToken 구글 ID 토큰
     * @param socialAccountId 구글 계정 ID (토큰의 sub 와 대조용)
     * @param name 이름 (토큰에 name 클레임이 없을 때 사용)
     */
    @Transactional
    public void joinWithCredential(String idToken, String socialAccountId, String name) {

        GoogleIdentityVo googleIdentityVo = googleIdTokenProvider.verify(idToken);

        if (!googleIdentityVo.getSocialAccountId().equals(socialAccountId)) {
            throw new SocialAccountMismatchException();
        }

        String resolvedName = googleIdentityVo.getName() == null || googleIdentityVo.getName().isBlank()
                ? name
                : googleIdentityVo.getName();

        join(googleIdentityVo.getEmail(), resolvedName, googleIdentityVo.getSocialAccountId(), RoleCode.NORMAL.getRole(), AccountPlatform.GOOGLE);
    }

    /**
     * Apple 방식 로그인
     * v1 은 Apple 계정을 구글 계정과 별개로 둔다. 계정 특정은 오직 검증된 sub 로만 한다.
     * Apple 은 이메일을 숨길 수 있어(privaterelay, 또는 아예 없음) 이메일을 계정 키로 쓸 수 없다.
     * @param identityToken Apple ID 토큰
     * @param socialAccountId Apple 계정 ID (토큰의 sub 와 대조용)
     * @param deviceId 기기 ID
     * @param appPackageName 앱 패키지 명
     * @param deviceName 기기명
     * @param buildVersion 앱 빌드 버전
     * @return 로그인 정보 Dto
     */
    @Transactional
    public LoginDto loginWithApple(String identityToken, String socialAccountId, String deviceId, String appPackageName, String deviceName, String buildVersion) {

        // 신뢰 경계. DB 조회보다 먼저 검증해 쓰레기 요청에 DB 를 낭비하지 않는다
        AppleIdentityVo appleIdentityVo = appleIdTokenProvider.verify(identityToken);

        // body 의 socialAccountId 는 같은 ID 토큰의 sub 여야 한다
        if (!appleIdentityVo.getSocialAccountId().equals(socialAccountId)) {
            throw new SocialAccountMismatchException();
        }

        // 앱 버전 체크
        if (appVersionService.getAppVersion(appPackageName, buildVersion).getMustUpdate()) {
            throw new NeedUpdateAppException();
        }

        // 회원 조회 (검증된 sub 로). 없으면 NotExistsAccountException 이 그대로 나가고,
        // 클라이언트는 그 에러 코드를 보고 회원가입으로 분기한다
        AccountVo accountVo = accountService.getAccountBySocialAccountId(appleIdentityVo.getSocialAccountId());

        // 플랫폼 백필 (platform 컬럼 도입 전 계정)
        accountService.fillPlatformIfEmpty(accountVo.getAccountId(), AccountPlatform.APPLE.name());

        return issueLogin(accountVo.getAccountId(), deviceId, appPackageName, deviceName, buildVersion);
    }

    /**
     * Apple 방식 회원 가입
     * @param identityToken Apple ID 토큰
     * @param socialAccountId Apple 계정 ID (토큰의 sub 와 대조용)
     * @param email 참고값. 저장하지 않는다 (아래 appleEmail 참고)
     * @param name 이름. Apple 은 최초 인가 때만 내려주므로 이 값이 유일한 출처다
     */
    @Transactional
    public void joinWithApple(String identityToken, String socialAccountId, String email, String name) {

        AppleIdentityVo appleIdentityVo = appleIdTokenProvider.verify(identityToken);

        if (!appleIdentityVo.getSocialAccountId().equals(socialAccountId)) {
            throw new SocialAccountMismatchException();
        }

        String resolvedSocialAccountId = appleIdentityVo.getSocialAccountId();

        String resolvedName = name == null || name.isBlank()
                ? "apple(" + resolvedSocialAccountId + ")"
                : name;

        // join() 을 재사용하지 않는다. 그쪽은 createAccount 를 부르고 email 로 중복 검사한다
        accountService.createSocialAccount(AccountVo.builder()
                .email(appleEmail(resolvedSocialAccountId))
                .name(resolvedName)
                .socialAccountId(resolvedSocialAccountId)
                .role(RoleCode.NORMAL.getRole())
                .platform(AccountPlatform.APPLE.name())
                .build());
    }

    /**
     * Apple 계정의 이메일 자리 표시자
     * 요청이나 토큰의 email 을 쓰지 않고 sub 에서 결정적으로 만든다. 조건부로 실제 이메일을 저장하면
     * (1) 최초 가입과 재가입에서 값이 달라져 비결정적이고,
     * (2) 그 이메일을 쓰는 구글 계정이 있으면 AlreadyExistsAccountException 이 나가 가입이 막힌다.
     * 비회원 가입이 deviceId + "@anonymous.com" 을 쓰는 것과 같은 요령이고,
     * .invalid 는 RFC 2606 예약 TLD 라 실제 주소와 충돌하지 않는다.
     * @param socialAccountId Apple 계정 ID
     * @return 이메일 자리 표시자
     */
    private static String appleEmail(String socialAccountId) {
        return socialAccountId + "@apple.invalid";
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
     * @param accessToken AccessToken
     * @param refreshToken RefreshToken
     * @return 재발행 토큰 정보 Dto
     */
    @Transactional
    public ReissueDto reissue(String accessToken, String refreshToken) {

        if (tokenProvider.isTokenExpired(refreshToken)) {
            throw new TokenExpiredException(refreshToken);
        }

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
                .accessToken(newAccessToken)
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

        if (!tokenService.isExistsToken(accessToken)) {
            throw new TokenExpiredException(accessToken);
        }

        return VerifyAccessTokenDto.builder()
                .accessToken(accessToken)
                .build();
    }

    /**
     * BuildVersion 검증
     * @param appPackageName 앱 패키지 명
     * @param buildVersion 빌드 버전
     * @return 검증 정보 Dto
     */
    @Transactional(readOnly = true)
    public VerifyBuildVersionDto verifyBuildVersion(String appPackageName, String buildVersion) {

        AppVersionVo appVersionVo = appVersionService.getAppVersion(appPackageName, buildVersion);

        return VerifyBuildVersionDto.builder()
                .appPackageName(appVersionVo.getAppPackageName())
                .buildVersion(appVersionVo.getBuildVersion())
                .mustUpdate(appVersionVo.getMustUpdate())
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

        if (!tokenService.isExistsToken(accessToken)) {
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

        if (!tokenService.isExistsToken(accessToken)) {
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
