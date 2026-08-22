package com.monglife.discovery.app.common.global.provider;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.monglife.discovery.app.common.auth.exception.IdTokenVerifyFailedException;
import com.monglife.discovery.app.common.auth.exception.InvalidIdTokenException;
import com.monglife.discovery.app.common.global.vo.GoogleIdentityVo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("GoogleIdTokenProvider")
class GoogleIdTokenProviderTest {

    private static final String ID_TOKEN = "id-token";
    private static final String SUB = "104729384756102938475";
    private static final String EMAIL = "user@gmail.com";

    @Mock private GoogleIdTokenVerifier googleIdTokenVerifier;

    @InjectMocks private GoogleIdTokenProvider googleIdTokenProvider;

    private GoogleIdToken googleIdToken(String email, Boolean emailVerified, String subject, String name) {

        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setEmail(email);
        payload.setEmailVerified(emailVerified);
        payload.setSubject(subject);

        if (name != null) {
            payload.set("name", name);
        }

        return new GoogleIdToken(
                new com.google.api.client.json.webtoken.JsonWebSignature.Header().setAlgorithm("RS256"),
                payload,
                new byte[]{1},
                new byte[]{1});
    }

    @Test
    @DisplayName("정상 토큰 - email/sub/name 을 매핑한다")
    void verify_success() throws Exception {

        given(googleIdTokenVerifier.verify(ID_TOKEN)).willReturn(googleIdToken(EMAIL, true, SUB, "몽이"));

        GoogleIdentityVo result = googleIdTokenProvider.verify(ID_TOKEN);

        assertThat(result.getEmail()).isEqualTo(EMAIL);
        assertThat(result.getSocialAccountId()).isEqualTo(SUB);
        assertThat(result.getName()).isEqualTo("몽이");
        assertThat(result.getEmailVerified()).isTrue();
    }

    @Test
    @DisplayName("name 클레임이 없어도 통과하고 name 은 null 이다")
    void verify_withoutName() throws Exception {

        given(googleIdTokenVerifier.verify(ID_TOKEN)).willReturn(googleIdToken(EMAIL, true, SUB, null));

        GoogleIdentityVo result = googleIdTokenProvider.verify(ID_TOKEN);

        assertThat(result.getName()).isNull();
        assertThat(result.getSocialAccountId()).isEqualTo(SUB);
    }

    @Test
    @DisplayName("검증 실패는 예외가 아니라 null 반환이다 - InvalidIdTokenException 으로 변환한다")
    void verify_returnsNull() throws Exception {

        given(googleIdTokenVerifier.verify(ID_TOKEN)).willReturn(null);

        assertThatThrownBy(() -> googleIdTokenProvider.verify(ID_TOKEN))
                .isInstanceOf(InvalidIdTokenException.class);
    }

    @Test
    @DisplayName("email_verified 가 false 면 거부한다")
    void verify_emailNotVerified() throws Exception {

        given(googleIdTokenVerifier.verify(ID_TOKEN)).willReturn(googleIdToken(EMAIL, false, SUB, "몽이"));

        assertThatThrownBy(() -> googleIdTokenProvider.verify(ID_TOKEN))
                .isInstanceOf(InvalidIdTokenException.class);
    }

    @Test
    @DisplayName("email_verified 가 없으면(null) 거부한다")
    void verify_emailVerifiedAbsent() throws Exception {

        given(googleIdTokenVerifier.verify(ID_TOKEN)).willReturn(googleIdToken(EMAIL, null, SUB, "몽이"));

        assertThatThrownBy(() -> googleIdTokenProvider.verify(ID_TOKEN))
                .isInstanceOf(InvalidIdTokenException.class);
    }

    @Test
    @DisplayName("sub 가 없으면 거부한다")
    void verify_noSubject() throws Exception {

        given(googleIdTokenVerifier.verify(ID_TOKEN)).willReturn(googleIdToken(EMAIL, true, null, "몽이"));

        assertThatThrownBy(() -> googleIdTokenProvider.verify(ID_TOKEN))
                .isInstanceOf(InvalidIdTokenException.class);
    }

    @Test
    @DisplayName("email 이 없으면 거부한다")
    void verify_noEmail() throws Exception {

        given(googleIdTokenVerifier.verify(ID_TOKEN)).willReturn(googleIdToken(null, true, SUB, "몽이"));

        assertThatThrownBy(() -> googleIdTokenProvider.verify(ID_TOKEN))
                .isInstanceOf(InvalidIdTokenException.class);
    }

    @Test
    @DisplayName("공개키 fetch 실패(IOException)는 서버 측 일시 장애로 구분한다")
    void verify_ioException() throws Exception {

        given(googleIdTokenVerifier.verify(ID_TOKEN)).willThrow(new IOException("certs unreachable"));

        assertThatThrownBy(() -> googleIdTokenProvider.verify(ID_TOKEN))
                .isInstanceOf(IdTokenVerifyFailedException.class);
    }

    @Test
    @DisplayName("GeneralSecurityException 도 서버 측 일시 장애로 구분한다")
    void verify_generalSecurityException() throws Exception {

        given(googleIdTokenVerifier.verify(ID_TOKEN)).willThrow(new GeneralSecurityException("boom"));

        assertThatThrownBy(() -> googleIdTokenProvider.verify(ID_TOKEN))
                .isInstanceOf(IdTokenVerifyFailedException.class);
    }

    @Test
    @DisplayName("파싱 불가한 토큰은 InvalidIdTokenException")
    void verify_malformed() throws Exception {

        given(googleIdTokenVerifier.verify(ID_TOKEN)).willThrow(new IllegalArgumentException("malformed"));

        assertThatThrownBy(() -> googleIdTokenProvider.verify(ID_TOKEN))
                .isInstanceOf(InvalidIdTokenException.class);
    }

    @Test
    @DisplayName("검증기가 NPE 를 던져도 500 이 아니라 InvalidIdTokenException 이어야 한다")
    void verify_npeFromVerifier() throws Exception {

        given(googleIdTokenVerifier.verify(ID_TOKEN)).willThrow(new NullPointerException());

        assertThatThrownBy(() -> googleIdTokenProvider.verify(ID_TOKEN))
                .isInstanceOf(InvalidIdTokenException.class);
    }

    /**
     * 실제 GoogleIdTokenVerifier 로 재현하는 회귀 테스트.
     * iss/exp 클레임이 없는 토큰은 서명 검증(네트워크) 이전 단계에서 터지므로 오프라인에서 돈다.
     * 이 케이스가 운영에서 500 을 냈다.
     */
    @Test
    @DisplayName("회귀: 클레임이 빠진 토큰(alg=none)을 실제 검증기에 넣어도 500 이 아니다")
    void verify_realVerifier_missingClaims() {

        GoogleIdTokenVerifier realVerifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(List.of("47490513860-lmo501flnou72fc7q5kq0ajfii6dpieb.apps.googleusercontent.com"))
                .setIssuers(List.of("accounts.google.com", "https://accounts.google.com"))
                .build();

        GoogleIdTokenProvider provider = new GoogleIdTokenProvider(realVerifier);

        // {"alg":"none"}.{}. — 헤더/페이로드는 파싱되지만 iss/aud/exp 가 없다
        assertThatThrownBy(() -> provider.verify("eyJhbGciOiJub25lIn0.e30."))
                .isInstanceOf(InvalidIdTokenException.class);
    }
}
