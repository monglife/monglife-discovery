package com.monglife.discovery.app.gateway.global.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ResolvableType;
import org.springframework.core.codec.Hints;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class HttpUtils {
    
    private final ObjectMapper objectMapper;

    public Optional<String> getHeader(ServerHttpRequest request, String key) {
        List<String> values = request.getHeaders().get(key);

        if (values != null && !values.isEmpty()) {
            return Optional.ofNullable(values.get(0));
        } else {
            return Optional.empty();
        }
    }

    public Optional<String> getJsonString(Object value) {
        try {
            String json = objectMapper.writeValueAsString(value);
            return Optional.ofNullable(json);
        } catch (JsonProcessingException e) {
            return Optional.empty();
        }
    }

    public <T> Mono<Void> setResponse(ServerWebExchange exchange, T responseDto) {

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
