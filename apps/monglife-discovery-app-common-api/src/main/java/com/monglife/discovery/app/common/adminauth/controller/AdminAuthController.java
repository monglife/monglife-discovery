package com.monglife.discovery.app.common.adminauth.controller;

import com.monglife.core.dto.response.ResponseDto;
import com.monglife.discovery.app.common.adminauth.dto.request.AdminEmailCodeRequestDto;
import com.monglife.discovery.app.common.adminauth.dto.request.AdminEmailVerifyRequestDto;
import com.monglife.discovery.app.common.adminauth.dto.response.AdminEmailCodeResponseDto;
import com.monglife.discovery.app.common.adminauth.dto.response.AdminLoginResponseDto;
import com.monglife.discovery.app.common.adminauth.enums.AdminAuthResponse;
import com.monglife.discovery.app.common.adminauth.service.AdminAuthService;
import com.monglife.discovery.app.common.auth.dto.etc.LoginDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 웹 로그인 (이메일 인증 코드).
 * @EntryLoggingPoint 를 붙이지 않는다 — 코드·이메일이 통째로 로그에 남는다.
 * 로그아웃은 기존 /public/auth/logout 을 쓴다.
 */
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/public/admin/auth")
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    @PostMapping("/email/code")
    public ResponseEntity<ResponseDto<AdminEmailCodeResponseDto>> issueEmailCode(@Valid @RequestBody AdminEmailCodeRequestDto dto) {

        adminAuthService.issueEmailCode(dto.getEmail());

        AdminEmailCodeResponseDto response = AdminEmailCodeResponseDto.builder()
                .expiresIn(adminAuthService.getExpirationSeconds())
                .resendAfter(adminAuthService.getResendAfterSeconds())
                .skipVerify(adminAuthService.isSkipVerify())
                .build();

        return ResponseEntity.ok().body(AdminAuthResponse.DISCOVERY_APP_ADMIN_AUTH_EMAIL_CODE.toResponseDto(response));
    }

    @PostMapping("/email/verify")
    public ResponseEntity<ResponseDto<AdminLoginResponseDto>> verifyEmailCode(@Valid @RequestBody AdminEmailVerifyRequestDto dto) {

        LoginDto loginDto = adminAuthService.verifyEmailCode(dto.getEmail(), dto.getCode());

        AdminLoginResponseDto response = AdminLoginResponseDto.builder()
                .accountId(loginDto.getAccountId())
                .accessToken(loginDto.getAccessToken())
                .refreshToken(loginDto.getRefreshToken())
                .build();

        return ResponseEntity.ok().body(AdminAuthResponse.DISCOVERY_APP_ADMIN_AUTH_EMAIL_VERIFY.toResponseDto(response));
    }
}
