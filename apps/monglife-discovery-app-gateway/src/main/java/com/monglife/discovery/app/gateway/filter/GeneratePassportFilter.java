package com.monglife.discovery.app.gateway.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.monglife.core.vo.passport.PassportDataVo;
import com.monglife.core.vo.passport.PassportVo;
import com.monglife.discovery.app.gateway.dto.etc.GeneratePassportLogDto;
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
    private final ObjectMapper objectMapper;

    public GeneratePassportFilter(WebClientService webClientService, HttpUtils httpUtils) {
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
                            String className = this.getClass().getName();
                            String methodName = Thread.currentThread().getStackTrace()[1].getMethodName();

                            GeneratePassportLogDto generatePassportLogDto = GeneratePassportLogDto.builder()
                                    .entryMethod(methodName)
                                    .className(className)
                                    .method(methodName)
                                    .accountId(passportVo.getData().getAccount().getAccountId())
                                    .appPackageName(passportVo.getData().getAppVersion().getAppPackageName())
                                    .buildVersion(passportVo.getData().getAppVersion().getBuildVersion())
                                    .build();

                            try {
                                log.info("{}", objectMapper.writeValueAsString(generatePassportLogDto));
                            } catch (Exception ignored) {}
                        }

                        return chain.filter(exchange);
                    });
        };
    }
}
