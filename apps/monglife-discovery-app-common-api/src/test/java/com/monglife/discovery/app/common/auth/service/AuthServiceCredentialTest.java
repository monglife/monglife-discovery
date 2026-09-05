package com.monglife.discovery.app.common.auth.service;

import com.monglife.discovery.app.common.auth.dto.etc.LoginDto;
import com.monglife.discovery.app.common.auth.exception.NeedUpdateAppException;
import com.monglife.discovery.app.common.auth.exception.SocialAccountMismatchException;
import com.monglife.discovery.app.common.global.provider.GoogleIdTokenProvider;
import com.monglife.discovery.app.common.global.provider.TokenProvider;
import com.monglife.discovery.app.common.global.vo.GoogleIdentityVo;
import com.monglife.discovery.domain.account.exception.NotExistsAccountException;
import com.monglife.discovery.domain.account.service.AccountService;
import com.monglife.discovery.domain.account.service.LoginHistoryService;
import com.monglife.discovery.domain.account.service.TokenService;
import com.monglife.discovery.domain.account.vo.AccountVo;
import com.monglife.discovery.domain.account.vo.TokenVo;
import com.monglife.discovery.domain.device.service.AppVersionService;
import com.monglife.discovery.domain.device.vo.AppVersionVo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

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
@DisplayName("AuthService credential 인증 경로")
class AuthServiceCredentialTest {

    private static final String ID_TOKEN = "id-token";
    private static final String SUB = "104729384756102938475";
    private static final String EMAIL = "user@gmail.com";
    private static final String DEVICE_ID = "device-1";
    private static final String APP_PACKAGE_NAME = "com.mongs.mobile";
    private static final String DEVICE_NAME = "Pixel 8";
    private static final String BUILD_VERSION = "1.0.0";
    private static final Long ACCOUNT_ID = 7L;

    @Mock private AccountService accountService;
    @Mock private AppVersionService appVersionService;
    @Mock private TokenService tokenService;
    @Mock private LoginHistoryService loginHistoryService;
    @Mock private TokenProvider tokenProvider;
    @Mock private GoogleIdTokenProvider googleIdTokenProvider;

    @InjectMocks private AuthService authService;

    @BeforeEach
    void setUp() {
        given(googleIdTokenProvider.verify(ID_TOKEN)).willReturn(GoogleIdentityVo.builder()
                .email(EMAIL)
                .socialAccountId(SUB)
                .name("몽이")
                .emailVerified(true)
                .build());

        given(appVersionService.getAppVersion(anyString(), anyString())).willReturn(AppVersionVo.builder()
                .appPackageName(APP_PACKAGE_NAME)
                .buildVersion(BUILD_VERSION)
                .mustUpdate(false)
                .build());

        given(tokenProvider.generateRefreshToken()).willReturn("refresh-token");
        given(tokenProvider.generateAccessToken(anyLong(), anyString(), anyString(), anyString())).willReturn("access-token");
        given(tokenProvider.getRefreshTokenExpiration()).willReturn(2592000L);
    }

    private void givenAccount(String storedSocialAccountId) {
        given(accountService.getAccount(EMAIL)).willReturn(AccountVo.builder()
                .accountId(ACCOUNT_ID)
                .email(EMAIL)
                .name("몽이")
                .socialAccountId(storedSocialAccountId)
                .role("NORMAL")
                .build());
    }

    private LoginDto login() {
        return authService.loginWithCredential(ID_TOKEN, SUB, DEVICE_ID, APP_PACKAGE_NAME, DEVICE_NAME, BUILD_VERSION);
    }

    @Test
    @DisplayName("정상 로그인 - 토큰을 발급하고 세션을 등록한다")
    void loginWithCredential_success() {

        givenAccount(SUB);

        LoginDto loginDto = login();

        assertThat(loginDto.getAccountId()).isEqualTo(ACCOUNT_ID);
        assertThat(loginDto.getAccessToken()).isEqualTo("access-token");
        assertThat(loginDto.getRefreshToken()).isEqualTo("refresh-token");

        ArgumentCaptor<TokenVo> captor = ArgumentCaptor.forClass(TokenVo.class);
        verify(tokenService, times(1)).createToken(captor.capture());
        assertThat(captor.getValue().getAccountId()).isEqualTo(ACCOUNT_ID);
        assertThat(captor.getValue().getDeviceId()).isEqualTo(DEVICE_ID);

        verify(tokenService).deleteToken(ACCOUNT_ID, DEVICE_ID);
        verify(loginHistoryService, times(1)).patchLoginHistory(any());
    }

    @Test
    @DisplayName("계정이 없으면 NotExistsAccountException 을 그대로 전파한다 - 클라이언트 회원가입 분기의 근거")
    void loginWithCredential_accountNotExists() {

        given(accountService.getAccount(EMAIL)).willThrow(new NotExistsAccountException());

        assertThatThrownBy(this::login).isInstanceOf(NotExistsAccountException.class);

        verify(tokenService, never()).createToken(any());
    }

    @Test
    @DisplayName("저장된 socialAccountId 가 null 이면 NPE 없이 백필한다")
    void loginWithCredential_backfillWhenNull() {

        givenAccount(null);

        LoginDto loginDto = login();

        assertThat(loginDto.getAccountId()).isEqualTo(ACCOUNT_ID);
        verify(accountService).updateSocialAccountId(EMAIL, SUB);
    }

    @Test
    @DisplayName("저장된 socialAccountId 가 공백이면 백필한다")
    void loginWithCredential_backfillWhenBlank() {

        givenAccount("   ");

        login();

        verify(accountService).updateSocialAccountId(EMAIL, SUB);
    }

    @Test
    @DisplayName("저장된 socialAccountId 가 토큰의 sub 와 다르면 거부한다")
    void loginWithCredential_storedMismatch() {

        givenAccount("another-google-account");

        assertThatThrownBy(this::login).isInstanceOf(SocialAccountMismatchException.class);

        verify(tokenService, never()).createToken(any());
        verify(accountService, never()).updateSocialAccountId(anyString(), anyString());
    }

    @Test
    @DisplayName("body 의 socialAccountId 가 토큰의 sub 와 다르면 DB 조회 전에 거부한다")
    void loginWithCredential_bodyMismatch() {

        assertThatThrownBy(() -> authService.loginWithCredential(
                ID_TOKEN, "spoofed-sub", DEVICE_ID, APP_PACKAGE_NAME, DEVICE_NAME, BUILD_VERSION))
                .isInstanceOf(SocialAccountMismatchException.class);

        verify(accountService, never()).getAccount(anyString());
    }

    @Test
    @DisplayName("강제 업데이트 대상이면 NeedUpdateAppException")
    void loginWithCredential_mustUpdate() {

        given(appVersionService.getAppVersion(APP_PACKAGE_NAME, BUILD_VERSION)).willReturn(AppVersionVo.builder()
                .appPackageName(APP_PACKAGE_NAME)
                .buildVersion(BUILD_VERSION)
                .mustUpdate(true)
                .build());

        assertThatThrownBy(this::login).isInstanceOf(NeedUpdateAppException.class);

        verify(accountService, never()).getAccount(anyString());
    }

    @Test
    @DisplayName("가입 - 토큰의 email/sub 로 가입하고 name 클레임을 우선한다")
    void joinWithCredential_prefersTokenName() {

        authService.joinWithCredential(ID_TOKEN, SUB, "body-name");

        ArgumentCaptor<AccountVo> captor = ArgumentCaptor.forClass(AccountVo.class);
        verify(accountService).createAccount(captor.capture());

        AccountVo created = captor.getValue();
        assertThat(created.getEmail()).isEqualTo(EMAIL);
        assertThat(created.getSocialAccountId()).isEqualTo(SUB);
        assertThat(created.getName()).isEqualTo("몽이");
        assertThat(created.getRole()).isEqualTo("NORMAL");
    }

    @Test
    @DisplayName("가입 - 토큰에 name 클레임이 없으면 body 값으로 폴백한다")
    void joinWithCredential_fallbackToBodyName() {

        given(googleIdTokenProvider.verify(ID_TOKEN)).willReturn(GoogleIdentityVo.builder()
                .email(EMAIL)
                .socialAccountId(SUB)
                .name(null)
                .emailVerified(true)
                .build());

        authService.joinWithCredential(ID_TOKEN, SUB, "body-name");

        ArgumentCaptor<AccountVo> captor = ArgumentCaptor.forClass(AccountVo.class);
        verify(accountService).createAccount(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("body-name");
    }

    @Test
    @DisplayName("가입 - body 의 socialAccountId 가 토큰의 sub 와 다르면 거부한다")
    void joinWithCredential_bodyMismatch() {

        assertThatThrownBy(() -> authService.joinWithCredential(ID_TOKEN, "spoofed-sub", "몽이"))
                .isInstanceOf(SocialAccountMismatchException.class);

        verify(accountService, never()).createAccount(any());
    }

    @Test
    @DisplayName("legacy login() 회귀 - issueLogin 추출 후에도 동작이 같다")
    void legacyLogin_unchanged() {

        givenAccount(SUB);

        LoginDto loginDto = authService.login(DEVICE_ID, SUB, EMAIL, APP_PACKAGE_NAME, DEVICE_NAME, BUILD_VERSION);

        assertThat(loginDto.getAccountId()).isEqualTo(ACCOUNT_ID);
        assertThat(loginDto.getAccessToken()).isEqualTo("access-token");
        assertThat(loginDto.getRefreshToken()).isEqualTo("refresh-token");

        verify(tokenService).deleteToken(ACCOUNT_ID, DEVICE_ID);
        verify(tokenService, times(1)).createToken(any());
        verify(loginHistoryService, times(1)).patchLoginHistory(any());
        verify(googleIdTokenProvider, never()).verify(anyString());
        // 이미 값이 있으므로 백필하지 않는다
        verify(accountService, never()).updateSocialAccountId(eq(EMAIL), anyString());
    }

    @Test
    @DisplayName("legacy login() 회귀 - socialAccountId 가 null 이어도 NPE 없이 백필한다")
    void legacyLogin_backfillWhenNull() {

        givenAccount(null);

        authService.login(DEVICE_ID, SUB, EMAIL, APP_PACKAGE_NAME, DEVICE_NAME, BUILD_VERSION);

        verify(accountService).updateSocialAccountId(EMAIL, SUB);
    }
}
