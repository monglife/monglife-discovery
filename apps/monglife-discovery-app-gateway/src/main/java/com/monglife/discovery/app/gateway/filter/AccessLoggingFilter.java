package com.monglife.discovery.app.gateway.filter;

import com.monglife.core.utils.CommonUtil;
import com.monglife.discovery.app.gateway.dto.etc.AccessLogDto;
import com.monglife.discovery.app.gateway.global.config.FilterConfig;
import com.monglife.module.common.logging.utils.LoggingUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AccessLoggingFilter extends AbstractGatewayFilterFactory<FilterConfig> {

    private final LoggingUtil loggingUtil;

    public AccessLoggingFilter(LoggingUtil loggingUtil) {
        super(FilterConfig.class);
        this.loggingUtil = loggingUtil;
    }

    @Override
    public GatewayFilter apply(FilterConfig config) {
        return (exchange, chain) -> {

            ServerHttpRequest request = exchange.getRequest();

            String traceId = exchange.getAttributeOrDefault("traceId", CommonUtil.randomId());
            int traceOffset = Integer.parseInt(exchange.getAttributeOrDefault("traceOffset", "-1")) + 1;

            exchange.getAttributes().put("traceId", traceId);
            exchange.getAttributes().put("traceOffset", String.valueOf(traceOffset));

            if (config.isPreLogger()) {
                String className = this.getClass().getName();
                String methodName = "apply";

                AccessLogDto accessLogDto = AccessLogDto.builder()
                        .traceId(traceId)
                        .traceOffset(traceOffset)
                        .entryMethod("")
                        .className(className)
                        .method(methodName)
                        .httpMethod(request.getMethod().name())
                        .mapping(request.getPath().value())
                        .build();

                log.info("{}", loggingUtil.parseJson(accessLogDto));
            }

            return chain.filter(exchange);
        };
    }
}
