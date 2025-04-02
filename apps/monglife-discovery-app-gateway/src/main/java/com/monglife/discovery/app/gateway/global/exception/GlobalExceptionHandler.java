package com.monglife.discovery.app.gateway.global.exception;

import com.monglife.core.dto.response.ResponseDto;
import com.monglife.core.enums.response.GlobalResponse;
import com.monglife.core.enums.response.Response;
import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.app.gateway.global.response.GatewayResponse;
import io.micrometer.common.lang.NonNullApi;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.cloud.gateway.support.NotFoundException;
import org.springframework.core.ResolvableType;
import org.springframework.core.annotation.Order;
import org.springframework.core.codec.Hints;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.ConnectException;
import java.util.Collections;
import java.util.Map;

@Slf4j
@Component
@NonNullApi
@Order(-1)
public class GlobalExceptionHandler implements ErrorWebExceptionHandler {

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable e) {
        ServerHttpRequest request = exchange.getRequest();

        String method = request.getMethod().name();
        String id = request.getId();
        String path = request.getPath().value();

        /* 시스템 정의 예외 처리 */
        if (e instanceof NotFoundException || e instanceof ConnectException || e instanceof WebClientRequestException) {
            log.error("{} => {} : {} : {} : {}", e.getClass().getSimpleName(), e.getMessage(), id, method, path);
            return setErrorResponse(exchange, GatewayResponse.DISCOVERY_GATEWAY_CONNECT_FAIL);
        } else if (e instanceof ErrorException errorException) {
            log.error("{} => {} : {} : {} : {} : {}", e.getClass().getSimpleName(), e.getMessage(), errorException.getResult(), id, method, path);
            return setErrorResponse(exchange, errorException.getResponse(), errorException.getResult());
        } else {
            log.error("{} => {} : {} : {} : {}", e.getClass().getSimpleName(), e.getMessage(), id, method, path);
            return setErrorResponse(exchange, GlobalResponse.INTERNAL_SERVER_ERROR);
        }
    }

    private Mono<Void> setErrorResponse(ServerWebExchange exchange, Response response) {
        return this.setErrorResponse(exchange, response, Collections.emptyMap());
    }

    private Mono<Void> setErrorResponse(ServerWebExchange exchange, Response response, Map<String, ?> result) {

        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        exchange.getResponse().setStatusCode(HttpStatusCode.valueOf(response.getHttpStatus()));
        ResponseDto<Map<String, ?>> responseDto = response.toResponseDto(result);

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
