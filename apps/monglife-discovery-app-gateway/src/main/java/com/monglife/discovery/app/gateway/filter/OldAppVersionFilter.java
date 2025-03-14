package com.monglife.discovery.app.gateway.filter;

import com.monglife.discovery.app.gateway.dto.response.OldVersionResponseDto;
import com.monglife.discovery.app.gateway.global.config.FilterConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.ResolvableType;
import org.springframework.core.codec.Hints;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Slf4j
@Component
public class OldAppVersionFilter extends AbstractGatewayFilterFactory<FilterConfig> {

    public OldAppVersionFilter() {
        super(FilterConfig.class);
    }

    @Override
    public GatewayFilter apply(FilterConfig config) {
        return (exchange, chain) -> {
            return setResponse(exchange, OldVersionResponseDto.builder()
                    .newestBuildVersion("2.0.0")
                    .createdAt(LocalDateTime.now())
                    .updateApp(true)
                    .updateCode(true)
                    .build());
        };
    }

    private <T> Mono<Void> setResponse(ServerWebExchange exchange, T responseDto) {

        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        exchange.getResponse().setStatusCode(HttpStatus.OK);

        return exchange.getResponse().writeWith(
                new Jackson2JsonEncoder()
                        .encode(Mono.just(responseDto),
                                exchange.getResponse().bufferFactory(),
                                ResolvableType.forInstance(responseDto),
                                MediaType.APPLICATION_JSON,
                                Hints.from(Hints.LOG_PREFIX_HINT, exchange.getLogPrefix()))
        );
    }
}
