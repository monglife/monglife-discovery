package com.monglife.discovery.gateway.global.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.gateway.global.response.GatewayResponse;
import lombok.Getter;

import java.util.Map;

@Getter
public class TokenExpiredException extends ErrorException {

    public TokenExpiredException(String accessToken) {
        this.response = GatewayResponse.DISCOVERY_GATEWAY_ACCESS_TOKEN_EXPIRED;
        this.result = Map.of("accessToken", accessToken);
    }
}
