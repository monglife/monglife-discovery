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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminAuthService 이메일 인증 로그인")
class AdminAuthServiceTest {

    private static final String EMAIL = "admin@monglife.cloud";
    private static final long ACCOUNT_ID = 1L;

    @Mock private AccountService accountService;
    @Mock private AdminEmailCodeService adminEmailCodeService;
    @Mock private TokenService tokenService;
    @Mock private TokenProvider tokenProvider;
    @Mock private MailService mailService;

    private AdminAuthService adminAuthService;

    @BeforeEach
    void setUp() {
        adminAuthService = new AdminAuthService(accountService, adminEmailCodeService, tokenService, tokenProvider, mailService, 300, 30, false);
        given(accountService.getAccount(EMAIL)).willReturn(account(RoleCode.ADMIN.getRole()));
        given(adminEmailCodeService.getCode(EMAIL)).willReturn(Optional.empty());
        given(tokenProvider.generateAccessToken(anyLong(), anyString(), anyString(), anyString())).willReturn("access");
        given(tokenProvider.generateRefreshToken()).willReturn("refresh");
        given(tokenProvider.getRefreshTokenExpiration()).willReturn(2592000L);
    }

    private static AccountVo account(String role) {
        return AccountVo.builder().accountId(ACCOUNT_ID).email(EMAIL).name("관리자").role(role).build();
    }

    @Test
    @DisplayName("코드 발송 - 코드를 저장하고 메일을 보낸다")
    void issueEmailCode_success() {
        adminAuthService.issueEmailCode(EMAIL);

        ArgumentCaptor<AdminEmailCodeVo> captor = ArgumentCaptor.forClass(AdminEmailCodeVo.class);
        verify(adminEmailCodeService, times(1)).saveCode(captor.capture());
        assertThat(captor.getValue().getCode()).matches("\\d{6}");
        assertThat(captor.getValue().getExpiration()).isEqualTo(300L);
        verify(mailService, times(1)).sendAdminEmailCode(eq(EMAIL), eq(captor.getValue().getCode()), eq(300L));
    }

    @Test
    @DisplayName("코드 발송 - NORMAL 계정은 거부한다")
    void issueEmailCode_notAdmin() {
        given(accountService.getAccount(EMAIL)).willReturn(account(RoleCode.NORMAL.getRole()));

        assertThatThrownBy(() -> adminAuthService.issueEmailCode(EMAIL)).isInstanceOf(NotAdminAccountException.class);
        verify(mailService, never()).sendAdminEmailCode(anyString(), anyString(), anyLong());
    }

    @Test
    @DisplayName("코드 발송 - 계정이 없어도 같은 예외로 응답해 존재 여부를 숨긴다")
    void issueEmailCode_noAccount() {
        given(accountService.getAccount(EMAIL)).willThrow(new NotExistsAccountException());

        assertThatThrownBy(() -> adminAuthService.issueEmailCode(EMAIL)).isInstanceOf(NotAdminAccountException.class);
    }

    @Test
    @DisplayName("코드 발송 - 재발송 제한 시간 안이면 거부한다")
    void issueEmailCode_tooMany() {
        given(adminEmailCodeService.getCode(EMAIL)).willReturn(Optional.of(
                AdminEmailCodeVo.builder().email(EMAIL).code("123456").issuedAt(LocalDateTime.now().minusSeconds(5)).expiration(300L).build()));

        assertThatThrownBy(() -> adminAuthService.issueEmailCode(EMAIL)).isInstanceOf(TooManyEmailCodeRequestsException.class);
        verify(adminEmailCodeService, never()).saveCode(any());
    }

    @Test
    @DisplayName("코드 검증 - 일치하면 토큰을 발급하고 코드를 지운다")
    void verifyEmailCode_success() {
        given(adminEmailCodeService.getCode(EMAIL)).willReturn(Optional.of(
                AdminEmailCodeVo.builder().email(EMAIL).code("123456").issuedAt(LocalDateTime.now()).expiration(300L).build()));

        LoginDto login = adminAuthService.verifyEmailCode(EMAIL, "123456");

        assertThat(login.getAccountId()).isEqualTo(ACCOUNT_ID);
        assertThat(login.getAccessToken()).isEqualTo("access");
        assertThat(login.getRefreshToken()).isEqualTo("refresh");
        verify(adminEmailCodeService, times(1)).deleteCode(EMAIL);

        ArgumentCaptor<TokenVo> captor = ArgumentCaptor.forClass(TokenVo.class);
        verify(tokenService, times(1)).createToken(captor.capture());
        assertThat(captor.getValue().getDeviceId()).isEqualTo(AdminAuthService.ADMIN_DEVICE_ID);
        assertThat(captor.getValue().getAppPackageName()).isEqualTo(AdminAuthService.ADMIN_APP_PACKAGE_NAME);
    }

    @Test
    @DisplayName("코드 검증 - 불일치는 InvalidEmailCode, 토큰을 만들지 않는다")
    void verifyEmailCode_invalid() {
        given(adminEmailCodeService.getCode(EMAIL)).willReturn(Optional.of(
                AdminEmailCodeVo.builder().email(EMAIL).code("123456").issuedAt(LocalDateTime.now()).expiration(300L).build()));

        assertThatThrownBy(() -> adminAuthService.verifyEmailCode(EMAIL, "000000")).isInstanceOf(InvalidEmailCodeException.class);
        verify(tokenService, never()).createToken(any());
    }

    @Test
    @DisplayName("코드 검증 - 저장된 코드가 없으면(만료) ExpiredEmailCode")
    void verifyEmailCode_expired() {
        assertThatThrownBy(() -> adminAuthService.verifyEmailCode(EMAIL, "123456")).isInstanceOf(ExpiredEmailCodeException.class);
    }

    @Test
    @DisplayName("skip-verify - 코드를 만들지도 보내지도 않고, 아무 코드로 토큰을 발급한다")
    void skipVerify() {
        adminAuthService = new AdminAuthService(accountService, adminEmailCodeService, tokenService, tokenProvider, mailService, 300, 30, true);

        adminAuthService.issueEmailCode(EMAIL);
        verify(adminEmailCodeService, never()).saveCode(any());
        verify(mailService, never()).sendAdminEmailCode(anyString(), anyString(), anyLong());

        LoginDto login = adminAuthService.verifyEmailCode(EMAIL, "000000");
        assertThat(login.getAccessToken()).isEqualTo("access");
        verify(adminEmailCodeService, never()).getCode(EMAIL);
        verify(tokenService, times(1)).createToken(any());
    }

    @Test
    @DisplayName("skip-verify 여도 관리자가 아니면 거부한다")
    void skipVerify_notAdmin() {
        adminAuthService = new AdminAuthService(accountService, adminEmailCodeService, tokenService, tokenProvider, mailService, 300, 30, true);
        given(accountService.getAccount(EMAIL)).willReturn(account(RoleCode.NORMAL.getRole()));

        assertThatThrownBy(() -> adminAuthService.verifyEmailCode(EMAIL, "000000")).isInstanceOf(NotAdminAccountException.class);
        verify(tokenService, never()).createToken(any());
    }
}
