package com.monglife.discovery.app.gateway.global.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.app.gateway.global.response.GatewayErrorCode;
import lombok.Getter;

import java.util.Map;

@Getter
public class TokenExpiredException extends ErrorException {

    public TokenExpiredException(String accessToken) {
        this.errorCode = GatewayErrorCode.DISCOVERY_GATEWAY_ACCESS_TOKEN_EXPIRED;
        this.result = Map.of("accessToken", accessToken);
    }
}
