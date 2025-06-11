package com.monglife.discovery.app.gateway.global.exception;

import com.monglife.core.dto.response.ResponseDto;
import com.monglife.core.enums.error.ErrorCode;
import com.monglife.core.enums.response.GlobalResponse;
import com.monglife.core.enums.response.Response;
import com.monglife.core.exception.ErrorException;
import com.monglife.core.utils.CommonUtil;
import com.monglife.discovery.app.gateway.global.response.GatewayErrorCode;
import com.monglife.module.common.logging.dto.ExceptionLogDto;
import com.monglife.module.common.logging.utils.ArgsUtil;
import com.monglife.module.common.logging.utils.LoggingUtil;
import io.micrometer.common.lang.NonNullApi;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.cloud.gateway.support.NotFoundException;
import org.springframework.core.ResolvableType;
import org.springframework.core.annotation.Order;
import org.springframework.core.codec.Hints;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.ConnectException;
import java.util.Collections;
import java.util.Map;

@Slf4j
@Order(-1)
@Component
@NonNullApi
@RequiredArgsConstructor
public class GlobalExceptionHandler implements ErrorWebExceptionHandler {

    private final ArgsUtil argsUtil;

    private final LoggingUtil loggingUtil;

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable e) {
        String traceId = exchange.getAttributeOrDefault("traceId", CommonUtil.randomId());
        int traceOffset = Integer.parseInt(exchange.getAttributeOrDefault("traceOffset", "-1")) + 1;

        exchange.getAttributes().put("traceId", traceId);
        exchange.getAttributes().put("traceOffset", String.valueOf(traceOffset));

        String className = this.getClass().getName();
        String methodName = "handle";

        ExceptionLogDto exceptionLogDto = ExceptionLogDto.builder()
                .traceId(traceId)
                .traceOffset(traceOffset)
                .entryMethod("")
                .className(className)
                .method(methodName)
                .message(e.getMessage())
                .stackTrace(argsUtil.generateExceptionTrace(e))
                .build();

        /* 시스템 정의 예외 처리 */
        if (e instanceof ErrorException errorException) {
            if (errorException instanceof TokenExpiredException) {
                log.info("{}", loggingUtil.parseJson(exceptionLogDto));
            } else {
                log.error("{}", loggingUtil.parseJson(exceptionLogDto));
            }
            return setErrorResponse(exchange, errorException.getErrorCode(), errorException.getResult());
        } else if (e instanceof NotFoundException || e instanceof ConnectException || e instanceof WebClientRequestException) {
            log.error("{}", loggingUtil.parseJson(exceptionLogDto));
            return setErrorResponse(exchange, GatewayErrorCode.DISCOVERY_GATEWAY_CONNECT_FAIL);
        } else {
            log.error("{}", loggingUtil.parseJson(exceptionLogDto));
            return setErrorResponse(exchange, GlobalResponse.INTERNAL_SERVER_ERROR);
        }
    }

    private Mono<Void> setErrorResponse(ServerWebExchange exchange, ErrorCode errorCode) {
        return this.setErrorResponse(exchange, errorCode, Collections.emptyMap());
    }

    private Mono<Void> setErrorResponse(ServerWebExchange exchange, ErrorCode errorCode, Map<String, ?> result) {

        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        exchange.getResponse().setStatusCode(HttpStatusCode.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()));
        ResponseDto<Map<String, ?>> responseDto = errorCode.toResponseDto(HttpStatus.INTERNAL_SERVER_ERROR.value(), result);

        return exchange.getResponse().writeWith(
                new Jackson2JsonEncoder()
                        .encode(Mono.just(responseDto),
                                exchange.getResponse().bufferFactory(),
                                ResolvableType.forInstance(responseDto),
                                MediaType.APPLICATION_JSON,
                                Hints.from(Hints.LOG_PREFIX_HINT, exchange.getLogPrefix()))
        );
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
