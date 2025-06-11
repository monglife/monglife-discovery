package com.monglife.discovery.app.gateway.service;

import com.monglife.core.dto.response.ResponseDto;
import com.monglife.discovery.app.gateway.dto.response.PassportDataResponseDto;
import com.monglife.discovery.app.gateway.dto.response.VerifyAccessTokenResponseDto;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class WebClientService {

    private final WebClient commonWebClient;

    public WebClientService(@Qualifier("commonWebClient") WebClient commonWebClient) {
        this.commonWebClient = commonWebClient;
    }

    public Mono<VerifyAccessTokenResponseDto> verityAccessToken(String accessToken, String traceId) {

        String url = "/api/auth/verify/accessToken?accessToken=%s".formatted(accessToken);

        return commonWebClient.get()
                .uri(url)
                .header("X-Trace-Id", URLEncoder.encode(traceId, StandardCharsets.UTF_8))
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ResponseDto<VerifyAccessTokenResponseDto>>() {})
                .map(ResponseDto::getResult);
    }

    public Mono<PassportDataResponseDto> getPassportData(String accessToken, String traceId) {

        String url = "/api/auth/passport?accessToken=%s".formatted(accessToken);

        return commonWebClient.get()
                .uri(url)
                .header("X-Trace-Id", URLEncoder.encode(traceId, StandardCharsets.UTF_8))
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ResponseDto<PassportDataResponseDto>>() {})
                .map(ResponseDto::getResult);
    }
}
