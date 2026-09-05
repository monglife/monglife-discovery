package com.monglife.discovery.app.common.global.config;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.Assert;

import java.util.List;

@Configuration
public class GoogleIdTokenConfig {

    /**
     * 구글 ID 토큰 검증기
     * NetHttpTransport 는 스레드 세이프하고 커넥션을 재사용하므로 싱글턴 빈으로 둔다.
     * GooglePublicKeysManager 가 Cache-Control 을 읽어 공개키 캐싱과 롤오버를 자동 처리한다.
     * @param googleClientIds 허용 클라이언트 ID 목록 (콤마 구분)
     * @return 구글 ID 토큰 검증기
     */
    @Bean
    public GoogleIdTokenVerifier googleIdTokenVerifier(@Value("${env.google.oauth.client-ids}") List<String> googleClientIds) {

        Assert.notEmpty(googleClientIds, "env.google.oauth.client-ids must not be empty");

        return new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(googleClientIds)
                // 기본값은 "accounts.google.com" 단일이라 반드시 명시해야 https:// 형태도 통과한다
                .setIssuers(List.of("accounts.google.com", "https://accounts.google.com"))
                .build();
    }
}
