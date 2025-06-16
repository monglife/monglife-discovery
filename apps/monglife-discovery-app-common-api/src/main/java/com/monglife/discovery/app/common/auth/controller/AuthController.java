package com.monglife.discovery.app.common.auth.controller;

import com.monglife.core.dto.response.ResponseDto;
import com.monglife.core.vo.passport.PassportDataAccountVo;
import com.monglife.core.vo.passport.PassportDataAppVersionVo;
import com.monglife.discovery.app.common.auth.dto.etc.*;
import com.monglife.discovery.app.common.auth.dto.response.*;
import com.monglife.discovery.app.common.userDevice.service.UserDeviceService;
import com.monglife.discovery.app.common.auth.dto.request.JoinRequestDto;
import com.monglife.discovery.app.common.auth.dto.request.LoginRequestDto;
import com.monglife.discovery.app.common.auth.dto.request.LogoutRequestDto;
import com.monglife.discovery.app.common.auth.dto.request.ReissueRequestDto;
import com.monglife.discovery.app.common.auth.enums.AuthResponse;
import com.monglife.discovery.app.common.auth.service.AuthService;
import com.monglife.module.common.logging.annotation.EntryLoggingPoint;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    private final UserDeviceService userDeviceService;

    /**
     * 회원 가입
     * @param joinRequestDto 회원 가입 정보 Dto
     * @return 성공 응답
     */
    @EntryLoggingPoint
    @PostMapping("/join")
    public ResponseEntity<ResponseDto<?>> join(@Valid @RequestBody JoinRequestDto joinRequestDto) {

        String email = joinRequestDto.getEmail();
        String name = joinRequestDto.getName();
        String socialAccountId = joinRequestDto.getSocialAccountId();

        authService.join(email, name, socialAccountId);

        return ResponseEntity.ok().body(AuthResponse.DISCOVERY_APP_AUTH_JOIN.toResponseDto());
    }

    /**
     * 로그인
     * @param loginRequestDto 로그인 정보 Dto
     * @return 토큰 정보 Dto
     */
    @EntryLoggingPoint
    @PostMapping("/login")
    public ResponseEntity<ResponseDto<LoginResponseDto>> login(@Valid @RequestBody LoginRequestDto loginRequestDto) {

        String deviceId = loginRequestDto.getDeviceId();
        String email = loginRequestDto.getEmail();
        String socialAccountId = loginRequestDto.getSocialAccountId();
        String appPackageName = loginRequestDto.getAppPackageName();
        String deviceName = loginRequestDto.getDeviceName();
        String buildVersion = loginRequestDto.getBuildVersion();

        LoginDto loginDto = authService.login(deviceId, socialAccountId, email, appPackageName, deviceName, buildVersion);

        // 기기 연결
        userDeviceService.connectAndroidDevice(loginDto.getAccountId(), deviceId);

        LoginResponseDto loginResponseDto = LoginResponseDto.builder()
                .accountId(loginDto.getAccountId())
                .accessToken(loginDto.getAccessToken())
                .refreshToken(loginDto.getRefreshToken())
                .build();

        return ResponseEntity.ok().body(AuthResponse.DISCOVERY_APP_AUTH_LOGIN.toResponseDto(loginResponseDto));
    }

    /**
     * 로그아웃
     * @param logoutRequestDto 로그 아웃 정보 Dto
     * @return 성공 응답
     */
    @EntryLoggingPoint
    @PostMapping("/logout")
    public ResponseEntity<ResponseDto<?>> logout(@Valid @RequestBody LogoutRequestDto logoutRequestDto) {

        String refreshToken = logoutRequestDto.getRefreshToken();

        LogoutDto logoutDto = authService.logout(refreshToken);

        // 기기 연결 해제
        userDeviceService.disconnectAndroidDevice(logoutDto.getAccountId(), logoutDto.getDeviceId());

        return ResponseEntity.ok().body(AuthResponse.DISCOVERY_APP_AUTH_LOGOUT.toResponseDto());
    }

    /**
     * 토큰 재발행
     * @param reissueRequestDto 토큰 재발행 정보 Dto
     * @return 재발행 토큰 정보 Dto
     */
    @EntryLoggingPoint
    @PostMapping("/reissue")
    public ResponseEntity<ResponseDto<ReissueResponseDto>> reissue(@Valid @RequestBody ReissueRequestDto reissueRequestDto) {

        String accessToken = reissueRequestDto.getAccessToken();
        String refreshToken = reissueRequestDto.getRefreshToken();

        ReissueDto reissueDto = authService.reissue(accessToken, refreshToken);

        ReissueResponseDto reissueResponseDto = ReissueResponseDto.builder()
                .accessToken(reissueDto.getAccessToken())
                .refreshToken(reissueDto.getRefreshToken())
                .build();

        return ResponseEntity.ok().body(AuthResponse.DISCOVERY_APP_AUTH_REISSUE.toResponseDto(reissueResponseDto));
    }

    /**
     * 앱 버전 검증
     * @param appPackageName 앱 패키지 명
     * @param buildVersion 앱 빌드 버전
     * @return 앱 빌드 버전 검증 응답 Dto
     */
    @EntryLoggingPoint
    @GetMapping("/verify/version")
    public ResponseEntity<ResponseDto<VerifyBuildVersionResponseDto>> verifyBuildVersion(
            @RequestParam("appPackageName") @NotBlank String appPackageName,
            @RequestParam("buildVersion") @NotBlank String buildVersion
    ) {
        VerifyBuildVersionDto verifyBuildVersionDto = authService.verifyBuildVersion(appPackageName, buildVersion);

        VerifyBuildVersionResponseDto verifyBuildVersionResponseDto = VerifyBuildVersionResponseDto.builder()
                .appPackageName(verifyBuildVersionDto.getAppPackageName())
                .buildVersion(verifyBuildVersionDto.getBuildVersion())
                .mustUpdate(verifyBuildVersionDto.getMustUpdate())
                .build();

        return ResponseEntity.ok().body(AuthResponse.DISCOVERY_APP_VERIFY_BUILD_VERSION.toResponseDto(verifyBuildVersionResponseDto));
    }

    /**
     * 엑세스 토큰 검증
     * @param accessToken 엑세스 토큰
     * @return 엑세스 토큰을 포함한 성공 응답 Dto
     */
    @EntryLoggingPoint
    @GetMapping("/verify/accessToken")
    public ResponseEntity<ResponseDto<VerifyAccessTokenResponseDto>> verifyAccessToken(@RequestParam("accessToken") @NotBlank String accessToken) {

        VerifyAccessTokenDto verifyAccessTokenDto = authService.verifyAccessToken(accessToken);

        VerifyAccessTokenResponseDto verifyAccessTokenResponseDto = VerifyAccessTokenResponseDto.builder()
                .accessToken(verifyAccessTokenDto.getAccessToken())
                .build();

        return ResponseEntity.ok().body(AuthResponse.DISCOVERY_APP_AUTH_VERIFY_TOKEN.toResponseDto(verifyAccessTokenResponseDto));
    }

    /**
     * Passport 데이터 조회
     * @param accessToken 엑세스 토큰
     * @return Passport 데이터 Dto
     */
    @EntryLoggingPoint
    @GetMapping("/passport")
    public ResponseEntity<ResponseDto<PassportDataResponseDto>> getPassportData(@RequestParam("accessToken") @NotBlank String accessToken) {

        PassportDataAccountVo passportDataAccountVo = authService.getPassportDataAccount(accessToken);

        PassportDataAppVersionVo passportDataAppVersionVo = authService.getPassportDataAppVersion(accessToken);

        PassportDataResponseDto passportDataResponseDto = PassportDataResponseDto.builder()
                .passportDataAccountVo(passportDataAccountVo)
                .passportDataAppVersionVo(passportDataAppVersionVo)
                .build();

        return ResponseEntity.ok().body(AuthResponse.DISCOVERY_APP_AUTH_GET_PASSPORT.toResponseDto(passportDataResponseDto));
    }
}
