package com.monglife.discovery.app.gateway.filter;

import com.monglife.discovery.app.gateway.global.config.FilterConfig;
import com.monglife.discovery.app.gateway.global.response.GatewayErrorCode;
import com.monglife.discovery.app.gateway.global.utils.HttpUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class InternalVerifyFilter extends AbstractGatewayFilterFactory<FilterConfig> {

    private final HttpUtils httpUtils;

    public InternalVerifyFilter(HttpUtils httpUtils) {
        super(FilterConfig.class);
        this.httpUtils = httpUtils;
    }

    @Override
    public GatewayFilter apply(FilterConfig config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            if (request.getURI().getPath().contains("/internal")) {
                return httpUtils.setResponse(
                        exchange,
                        GatewayErrorCode.DISCOVERY_GATEWAY_ACCESS_UNAUTHORIZATION_PATH
                                .toResponseDto(HttpStatus.FORBIDDEN.value()));
            }

            return chain.filter(exchange);
        };
    }

}
