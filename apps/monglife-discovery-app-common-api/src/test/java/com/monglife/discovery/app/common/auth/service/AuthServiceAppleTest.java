package com.monglife.discovery.app.common.auth.service;

import com.monglife.discovery.app.common.auth.dto.etc.LoginDto;
import com.monglife.discovery.app.common.auth.exception.NeedUpdateAppException;
import com.monglife.discovery.app.common.auth.exception.SocialAccountMismatchException;
import com.monglife.discovery.app.common.global.provider.AppleIdTokenProvider;
import com.monglife.discovery.app.common.global.provider.GoogleIdTokenProvider;
import com.monglife.discovery.app.common.global.provider.TokenProvider;
import com.monglife.discovery.app.common.global.vo.AppleIdentityVo;
import com.monglife.discovery.domain.account.exception.NotExistsAccountException;
import com.monglife.discovery.domain.account.service.AccountService;
import com.monglife.discovery.domain.account.service.LoginHistoryService;
import com.monglife.discovery.domain.account.service.TokenService;
import com.monglife.discovery.domain.account.vo.AccountVo;
import com.monglife.discovery.domain.account.vo.TokenVo;
import com.monglife.discovery.domain.device.service.AppVersionService;
import com.monglife.discovery.domain.device.service.MaintenanceService;
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
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthService apple 인증 경로")
class AuthServiceAppleTest {

    private static final String IDENTITY_TOKEN = "identity-token";
    private static final String SUB = "001234.a1b2c3d4e5f6.1234";
    private static final String DEVICE_ID = "9F3A2B10-4C5D-6E7F-8A9B-0C1D2E3F4A5B";
    private static final String APP_PACKAGE_NAME = "com.mongs.wear";
    private static final String DEVICE_NAME = "Apple Watch";
    private static final String BUILD_VERSION = "2.2.1";
    private static final Long ACCOUNT_ID = 9L;

    @Mock private AccountService accountService;
    @Mock private AppVersionService appVersionService;
    @Mock private MaintenanceService maintenanceService;
    @Mock private TokenService tokenService;
    @Mock private LoginHistoryService loginHistoryService;
    @Mock private TokenProvider tokenProvider;
    @Mock private GoogleIdTokenProvider googleIdTokenProvider;
    @Mock private AppleIdTokenProvider appleIdTokenProvider;

    @InjectMocks private AuthService authService;

    @BeforeEach
    void setUp() {
        given(appleIdTokenProvider.verify(IDENTITY_TOKEN)).willReturn(AppleIdentityVo.builder()
                .socialAccountId(SUB)
                .email("abc123@privaterelay.appleid.com")
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

    private void givenAccount() {
        given(accountService.getAccountBySocialAccountId(SUB)).willReturn(AccountVo.builder()
                .accountId(ACCOUNT_ID)
                .email(SUB + "@apple.invalid")
                .name("홍 길동")
                .socialAccountId(SUB)
                .role("NORMAL")
                .build());
    }

    private LoginDto login() {
        return authService.loginWithApple(IDENTITY_TOKEN, SUB, DEVICE_ID, APP_PACKAGE_NAME, DEVICE_NAME, BUILD_VERSION);
    }

    private AccountVo captureCreatedAccount() {
        ArgumentCaptor<AccountVo> captor = ArgumentCaptor.forClass(AccountVo.class);
        verify(accountService).createSocialAccount(captor.capture());
        return captor.getValue();
    }

    @Test
    @DisplayName("정상 로그인 - 토큰을 발급하고 세션을 등록한다")
    void loginWithApple_success() {

        givenAccount();

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
    @DisplayName("계정 조회는 이메일이 아니라 검증된 sub 로 한다")
    void loginWithApple_looksUpBySocialAccountId() {

        givenAccount();

        login();

        verify(accountService).getAccountBySocialAccountId(SUB);
        verify(accountService, never()).getAccount(anyString());
    }

    @Test
    @DisplayName("계정이 없으면 NotExistsAccountException 을 그대로 전파한다 - 클라이언트 회원가입 분기의 근거")
    void loginWithApple_accountNotExists() {

        given(accountService.getAccountBySocialAccountId(SUB)).willThrow(new NotExistsAccountException(SUB));

        assertThatThrownBy(this::login).isInstanceOf(NotExistsAccountException.class);

        verify(tokenService, never()).createToken(any());
    }

    @Test
    @DisplayName("body 의 socialAccountId 가 토큰의 sub 와 다르면 DB 조회 전에 거부한다")
    void loginWithApple_bodyMismatch() {

        assertThatThrownBy(() -> authService.loginWithApple(
                IDENTITY_TOKEN, "spoofed-sub", DEVICE_ID, APP_PACKAGE_NAME, DEVICE_NAME, BUILD_VERSION))
                .isInstanceOf(SocialAccountMismatchException.class);

        verify(accountService, never()).getAccountBySocialAccountId(anyString());
        verify(tokenService, never()).createToken(any());
    }

    @Test
    @DisplayName("강제 업데이트 대상이면 NeedUpdateAppException")
    void loginWithApple_mustUpdate() {

        given(appVersionService.getAppVersion(APP_PACKAGE_NAME, BUILD_VERSION)).willReturn(AppVersionVo.builder()
                .appPackageName(APP_PACKAGE_NAME)
                .buildVersion(BUILD_VERSION)
                .mustUpdate(true)
                .build());

        assertThatThrownBy(this::login).isInstanceOf(NeedUpdateAppException.class);

        verify(accountService, never()).getAccountBySocialAccountId(anyString());
    }

    @Test
    @DisplayName("가입 - 이메일은 요청값을 무시하고 sub 로 만든다")
    void joinWithApple_ignoresRequestEmail() {

        authService.joinWithApple(IDENTITY_TOKEN, SUB, "real-user@icloud.com", "홍 길동");

        AccountVo created = captureCreatedAccount();

        assertThat(created.getEmail()).isEqualTo(SUB + "@apple.invalid");
        assertThat(created.getSocialAccountId()).isEqualTo(SUB);
        assertThat(created.getName()).isEqualTo("홍 길동");
        assertThat(created.getRole()).isEqualTo("NORMAL");
    }

    @Test
    @DisplayName("가입 - name 이 없으면 sub 기반 이름으로 대체한다")
    void joinWithApple_fallbackName() {

        authService.joinWithApple(IDENTITY_TOKEN, SUB, null, null);

        assertThat(captureCreatedAccount().getName()).isEqualTo("apple(" + SUB + ")");
    }

    @Test
    @DisplayName("가입 - name 이 공백이어도 sub 기반 이름으로 대체한다")
    void joinWithApple_fallbackNameWhenBlank() {

        authService.joinWithApple(IDENTITY_TOKEN, SUB, null, "   ");

        assertThat(captureCreatedAccount().getName()).isEqualTo("apple(" + SUB + ")");
    }

    @Test
    @DisplayName("가입 - 이메일 중복 검사를 하는 createAccount 를 쓰지 않는다")
    void joinWithApple_doesNotUseEmailBasedCreate() {

        authService.joinWithApple(IDENTITY_TOKEN, SUB, null, "홍 길동");

        verify(accountService).createSocialAccount(any());
        verify(accountService, never()).createAccount(any());
    }

    @Test
    @DisplayName("가입 - body 의 socialAccountId 가 토큰의 sub 와 다르면 거부한다")
    void joinWithApple_bodyMismatch() {

        assertThatThrownBy(() -> authService.joinWithApple(IDENTITY_TOKEN, "spoofed-sub", null, "홍 길동"))
                .isInstanceOf(SocialAccountMismatchException.class);

        verify(accountService, never()).createSocialAccount(any());
    }

    @Test
    @DisplayName("apple 경로는 구글 검증기를 호출하지 않는다")
    void appleDoesNotTouchGoogleProvider() {

        givenAccount();

        login();
        authService.joinWithApple(IDENTITY_TOKEN, SUB, null, "홍 길동");

        verify(googleIdTokenProvider, never()).verify(anyString());
    }
}
