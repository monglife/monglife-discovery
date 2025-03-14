package com.monglife.discovery.app.common.auth.controller;

import com.monglife.core.dto.response.ResponseDto;
import com.monglife.core.vo.passport.PassportDataAccountVo;
import com.monglife.core.vo.passport.PassportDataAppVersionVo;
import com.monglife.discovery.app.common.userDevice.service.UserDeviceService;
import com.monglife.discovery.app.common.auth.dto.etc.LoginDto;
import com.monglife.discovery.app.common.auth.dto.etc.LogoutDto;
import com.monglife.discovery.app.common.auth.dto.etc.ReissueDto;
import com.monglife.discovery.app.common.auth.dto.etc.VerifyAccessTokenDto;
import com.monglife.discovery.app.common.auth.dto.request.JoinRequestDto;
import com.monglife.discovery.app.common.auth.dto.request.LoginRequestDto;
import com.monglife.discovery.app.common.auth.dto.request.LogoutRequestDto;
import com.monglife.discovery.app.common.auth.dto.request.ReissueRequestDto;
import com.monglife.discovery.app.common.auth.dto.response.LoginResponseDto;
import com.monglife.discovery.app.common.auth.dto.response.PassportDataResponseDto;
import com.monglife.discovery.app.common.auth.dto.response.ReissueResponseDto;
import com.monglife.discovery.app.common.auth.dto.response.ValidationAccessTokenResponseDto;
import com.monglife.discovery.app.common.auth.enums.AuthResponse;
import com.monglife.discovery.app.common.auth.service.AuthService;
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
    @PostMapping("/join")
    public ResponseEntity<ResponseDto<?>> join(@RequestBody JoinRequestDto joinRequestDto) {

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
    @PostMapping("/login")
    public ResponseEntity<ResponseDto<LoginResponseDto>> login(@RequestBody LoginRequestDto loginRequestDto) {

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
     * 로그 아웃
     * @param logoutRequestDto 로그 아웃 정보 Dto
     * @return 성공 응답
     */
    @PostMapping("/logout")
    public ResponseEntity<ResponseDto<?>> logout(@RequestBody LogoutRequestDto logoutRequestDto) {

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
    @PostMapping("/reissue")
    public ResponseEntity<ResponseDto<ReissueResponseDto>> reissue(@RequestBody ReissueRequestDto reissueRequestDto) {

        ReissueDto reissueDto = authService.reissue(reissueRequestDto.getRefreshToken());

        ReissueResponseDto reissueResponseDto = ReissueResponseDto.builder()
                .accessToken(reissueDto.getAccessToken())
                .refreshToken(reissueDto.getRefreshToken())
                .build();

        return ResponseEntity.ok().body(AuthResponse.DISCOVERY_APP_AUTH_REISSUE.toResponseDto(reissueResponseDto));
    }

    /**
     * 엑세스 토큰 검증
     * @param accessToken 엑세스 토큰
     * @return 엑세스 토큰을 포함한 성공 응답 Dto
     */
    @GetMapping("/verify/accessToken")
    public ResponseEntity<ResponseDto<ValidationAccessTokenResponseDto>> verifyAccessToken(@RequestParam("accessToken") @NotBlank String accessToken) {

        VerifyAccessTokenDto verifyAccessTokenDto = authService.verifyAccessToken(accessToken);

        ValidationAccessTokenResponseDto validationAccessTokenResponseDto = ValidationAccessTokenResponseDto.builder()
                .accessToken(verifyAccessTokenDto.getAccessToken())
                .build();

        return ResponseEntity.ok().body(AuthResponse.DISCOVERY_APP_AUTH_VALIDATION_TOKEN.toResponseDto(validationAccessTokenResponseDto));
    }

    /**
     * Passport 데이터 조회
     * @param accessToken 엑세스 토큰
     * @return Passport 데이터 Dto
     */
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
