package com.monglife.discovery.app.common.adminauth.service;

import com.monglife.core.enums.role.RoleCode;
import com.monglife.discovery.app.common.adminauth.exception.ExpiredEmailCodeException;
import com.monglife.discovery.app.common.adminauth.exception.InvalidEmailCodeException;
import com.monglife.discovery.app.common.adminauth.exception.NotAdminAccountException;
import com.monglife.discovery.app.common.adminauth.exception.TooManyEmailCodeRequestsException;
import com.monglife.discovery.app.common.auth.dto.etc.LoginDto;
import com.monglife.discovery.app.common.global.mail.MailService;
import com.monglife.discovery.app.common.global.provider.TokenProvider;
import com.monglife.discovery.domain.account.exception.NotExistsAccountException;
import com.monglife.discovery.domain.account.service.AccountService;
import com.monglife.discovery.domain.account.service.AdminEmailCodeService;
import com.monglife.discovery.domain.account.service.TokenService;
import com.monglife.discovery.domain.account.vo.AccountVo;
import com.monglife.discovery.domain.account.vo.AdminEmailCodeVo;
import com.monglife.discovery.domain.account.vo.TokenVo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * 관리자 이메일 인증(OTP) 로그인.
 * 앱 로그인과 달리 AppVersion 검사·로그인 이력이 없다. 토큰은 같은 TokenProvider 로 만들어
 * 기존 AuthenticationFilter / 로그아웃 경로를 그대로 탄다.
 */
@Service
public class AdminAuthService {

    /** 관리자 웹 토큰의 기기·앱 식별자. AppVersion 테이블에 없어도 된다 (패스포트는 토큰 클레임만 쓴다) */
    public static final String ADMIN_DEVICE_ID = "admin-web";
    public static final String ADMIN_APP_PACKAGE_NAME = "com.monglife.admin";
    public static final String ADMIN_BUILD_VERSION = "0.1.0";

    private final AccountService accountService;
    private final AdminEmailCodeService adminEmailCodeService;
    private final TokenService tokenService;
    private final TokenProvider tokenProvider;
    private final MailService mailService;
    private final long expirationSeconds;
    private final long resendAfterSeconds;
    /** true 면 코드 발송·검증을 건너뛰고 관리자 계정 확인만으로 로그인한다 (local/dev 전용) */
    private final boolean skipVerify;
    private final SecureRandom random = new SecureRandom();

    public AdminAuthService(
            AccountService accountService,
            AdminEmailCodeService adminEmailCodeService,
            TokenService tokenService,
            TokenProvider tokenProvider,
            MailService mailService,
            @Value("${env.admin.email-code.expiration-seconds}") long expirationSeconds,
            @Value("${env.admin.email-code.resend-after-seconds}") long resendAfterSeconds,
            @Value("${env.admin.email-code.skip-verify}") boolean skipVerify
    ) {
        this.accountService = accountService;
        this.adminEmailCodeService = adminEmailCodeService;
        this.tokenService = tokenService;
        this.tokenProvider = tokenProvider;
        this.mailService = mailService;
        this.expirationSeconds = expirationSeconds;
        this.resendAfterSeconds = resendAfterSeconds;
        this.skipVerify = skipVerify;
    }

    public boolean isSkipVerify() {
        return skipVerify;
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }

    public long getResendAfterSeconds() {
        return resendAfterSeconds;
    }

    /**
     * 1단계: 관리자 계정인지 확인하고 인증 코드를 메일로 보낸다.
     * 계정이 없어도 NotAdminAccount 로 응답해 계정 존재 여부를 노출하지 않는다.
     * skip-verify 면 관리자 계정 확인만 하고 코드를 만들지 않는다.
     */
    @Transactional
    public void issueEmailCode(String email) {

        AccountVo account = findAdminAccount(email);

        if (skipVerify) {
            return;
        }

        adminEmailCodeService.getCode(account.getEmail()).ifPresent(existing -> {
            long elapsed = Duration.between(existing.getIssuedAt(), LocalDateTime.now()).getSeconds();
            if (elapsed < resendAfterSeconds) {
                throw new TooManyEmailCodeRequestsException(resendAfterSeconds - elapsed);
            }
        });

        String code = String.format("%06d", random.nextInt(1_000_000));

        adminEmailCodeService.saveCode(AdminEmailCodeVo.builder()
                .email(account.getEmail())
                .code(code)
                .issuedAt(LocalDateTime.now())
                .expiration(expirationSeconds)
                .build());

        mailService.sendAdminEmailCode(account.getEmail(), code, expirationSeconds);
    }

    /**
     * 2단계: 코드 검증 → 토큰 발급. 코드는 1회용이다.
     * skip-verify 면 코드를 보지 않고 바로 발급한다.
     */
    @Transactional
    public LoginDto verifyEmailCode(String email, String code) {

        AccountVo account = findAdminAccount(email);

        if (!skipVerify) {
            AdminEmailCodeVo issued = adminEmailCodeService.getCode(account.getEmail())
                    // TTL 이 지나면 Redis 가 지우므로 "없음" 은 만료로 본다
                    .orElseThrow(() -> new ExpiredEmailCodeException(email));

            if (!issued.getCode().equals(code)) {
                throw new InvalidEmailCodeException(email);
            }

            adminEmailCodeService.deleteCode(account.getEmail());
        }

        // 기존 관리자 세션 정리 (같은 기기 식별자)
        tokenService.deleteToken(account.getAccountId(), ADMIN_DEVICE_ID);

        String refreshToken = tokenProvider.generateRefreshToken();
        String accessToken = tokenProvider.generateAccessToken(account.getAccountId(), ADMIN_DEVICE_ID, ADMIN_APP_PACKAGE_NAME, ADMIN_BUILD_VERSION);

        tokenService.createToken(TokenVo.builder()
                .refreshToken(refreshToken)
                .accessToken(accessToken)
                .deviceId(ADMIN_DEVICE_ID)
                .accountId(account.getAccountId())
                .appPackageName(ADMIN_APP_PACKAGE_NAME)
                .buildVersion(ADMIN_BUILD_VERSION)
                .createdAt(LocalDateTime.now())
                .expiration(tokenProvider.getRefreshTokenExpiration())
                .build());

        return LoginDto.builder()
                .accountId(account.getAccountId())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    private AccountVo findAdminAccount(String email) {
        AccountVo account;
        try {
            account = accountService.getAccount(email);
        } catch (NotExistsAccountException e) {
            throw new NotAdminAccountException(email);
        }
        if (!RoleCode.ADMIN.getRole().equals(account.getRole())) {
            throw new NotAdminAccountException(email);
        }
        return account;
    }
}
