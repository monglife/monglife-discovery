package com.monglife.discovery.app.common.global.provider;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.monglife.discovery.app.common.auth.exception.IdTokenVerifyFailedException;
import com.monglife.discovery.app.common.auth.exception.InvalidIdTokenException;
import com.monglife.discovery.app.common.global.vo.GoogleIdentityVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.security.GeneralSecurityException;

@Component
@RequiredArgsConstructor
public class GoogleIdTokenProvider {

    private final GoogleIdTokenVerifier googleIdTokenVerifier;

    /**
     * 구글 ID 토큰 검증
     * 서명 / iss / aud / exp 는 GoogleIdTokenVerifier 가 처리하고,
     * 계정 키로 쓰는 email 의 신뢰성(email_verified)과 sub 존재 여부를 여기서 추가로 확인한다.
     * @param idToken 구글 ID 토큰
     * @return 검증된 구글 계정 정보
     */
    public GoogleIdentityVo verify(String idToken) {

        GoogleIdToken googleIdToken;

        try {
            googleIdToken = googleIdTokenVerifier.verify(idToken);
        } catch (GeneralSecurityException | IOException e) {
            // 공개키 fetch 실패 등 서버 측 일시 장애. "토큰이 잘못됨" 과 구분한다
            throw new IdTokenVerifyFailedException();
        } catch (RuntimeException e) {
            // 신뢰할 수 없는 입력을 파싱하는 구간이라 검증기가 던지는 런타임 예외는
            // 전부 "토큰이 잘못됨" 으로 본다. 클레임이 빠진 토큰에서 검증기 내부가
            // List.of(...).contains(null) 이나 null 언박싱으로 NPE 를 내기 때문에
            // IllegalArgumentException 만 잡으면 500 이 나간다.
            throw new InvalidIdTokenException();
        }

        // 검증 실패는 예외가 아니라 null 반환이다
        if (googleIdToken == null) {
            throw new InvalidIdTokenException();
        }

        GoogleIdToken.Payload payload = googleIdToken.getPayload();

        // email 을 계정 키로 쓰므로 필수
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new InvalidIdTokenException();
        }

        String socialAccountId = payload.getSubject();
        String email = payload.getEmail();

        if (socialAccountId == null || socialAccountId.isBlank() || email == null || email.isBlank()) {
            throw new InvalidIdTokenException();
        }

        return GoogleIdentityVo.builder()
                .email(email)
                .socialAccountId(socialAccountId)
                .name((String) payload.get("name"))
                .emailVerified(true)
                .build();
    }
}
