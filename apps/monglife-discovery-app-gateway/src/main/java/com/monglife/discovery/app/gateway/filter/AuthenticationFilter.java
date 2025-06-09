package com.monglife.discovery.app.gateway.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.monglife.discovery.app.gateway.dto.etc.AuthenticationLogDto;
import com.monglife.discovery.app.gateway.service.WebClientService;
import com.monglife.discovery.app.gateway.global.config.FilterConfig;
import com.monglife.discovery.app.gateway.global.exception.TokenExpiredException;
import com.monglife.discovery.app.gateway.global.exception.TokenNotFoundException;
import com.monglife.discovery.app.gateway.global.utils.HttpUtils;
import com.monglife.module.common.logging.annotation.EntryLoggingPoint;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<FilterConfig> {

    private final WebClientService webClientService;
    private final HttpUtils httpUtils;
    private final ObjectMapper objectMapper;

    public AuthenticationFilter(WebClientService webClientService, HttpUtils httpUtils) {
        super(FilterConfig.class);
        this.webClientService = webClientService;
        this.httpUtils = httpUtils;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        this.objectMapper.configure(SerializationFeature.FAIL_ON_SELF_REFERENCES, false);
        this.objectMapper.configure(SerializationFeature.FAIL_ON_UNWRAPPED_TYPE_IDENTIFIERS, false);
    }

    @Override
    public GatewayFilter apply(FilterConfig config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            String accessToken = httpUtils.getHeader(request, "Authorization")
                    .orElseThrow(TokenNotFoundException::new)
                    .substring(6)
                    .trim();

            return webClientService.verityAccessToken(accessToken)
                    .onErrorMap(throwable -> new TokenExpiredException(accessToken))
                    .flatMap(validationAccessTokenResDto -> {
                        if (config.isPreLogger()) {

                            String className = this.getClass().getName();
                            String methodName = Thread.currentThread().getStackTrace()[1].getMethodName();

                            AuthenticationLogDto authenticationLogDto = AuthenticationLogDto.builder()
                                    .entryMethod(methodName)
                                    .className(className)
                                    .method(methodName)
                                    .accessToken(accessToken)
                                    .build();
                            try {
                                log.info("{}", objectMapper.writeValueAsString(authenticationLogDto));
                            } catch (Exception ignored) {}
                        }

                        return chain.filter(exchange);
                    });
        };
    }
}
