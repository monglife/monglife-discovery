package com.monglife.discovery.app.gateway.filter;

import com.monglife.core.vo.passport.PassportDataVo;
import com.monglife.core.vo.passport.PassportVo;
import com.monglife.discovery.app.gateway.service.WebClientService;
import com.monglife.discovery.app.gateway.global.config.FilterConfig;
import com.monglife.discovery.app.gateway.global.exception.PassportGenerateException;
import com.monglife.discovery.app.gateway.global.exception.TokenNotFoundException;
import com.monglife.discovery.app.gateway.global.utils.HttpUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Slf4j
@Component
public class GeneratePassportFilter extends AbstractGatewayFilterFactory<FilterConfig> {

    private final WebClientService webClientService;
    private final HttpUtils httpUtils;

    public GeneratePassportFilter(WebClientService webClientService, HttpUtils httpUtils) {
        super(FilterConfig.class);
        this.webClientService = webClientService;
        this.httpUtils = httpUtils;
    }

    @Override
    public GatewayFilter apply(FilterConfig config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            String accessToken = httpUtils.getHeader(request, "Authorization")
                    .orElseThrow(TokenNotFoundException::new)
                    .substring(7);

            return webClientService.getPassportData(accessToken)
                    .onErrorMap(throwable -> new PassportGenerateException(accessToken))
                    .flatMap(passportDataVo -> {
                        PassportVo passportVo = PassportVo.builder()
                                .data(PassportDataVo.builder()
                                        .account(passportDataVo.getPassportDataAccountVo())
                                        .appVersion(passportDataVo.getPassportDataAppVersionVo())
                                        .build())
                                .createdAt(LocalDateTime.now())
                                .build();

                        String passportJson = httpUtils.getJsonString(passportVo)
                                .orElseThrow(() -> new PassportGenerateException(accessToken));

                        request.mutate().header("passport", URLEncoder.encode(passportJson, StandardCharsets.UTF_8)).build();

                        if (config.isPreLogger()) {
                            log.info("[PassportFilter] Passport: {}", passportJson);
                        }

                        return chain.filter(exchange);
                    });
        };
    }
}
