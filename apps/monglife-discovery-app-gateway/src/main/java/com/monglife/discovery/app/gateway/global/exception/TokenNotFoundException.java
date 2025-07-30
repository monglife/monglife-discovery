package com.monglife.discovery.app.gateway.global.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.app.gateway.global.response.GatewayErrorCode;
import lombok.Getter;

import java.util.Collections;

@Getter
public class TokenNotFoundException extends ErrorException {

    public TokenNotFoundException() {
        this.errorCode = GatewayErrorCode.DISCOVERY_GATEWAY_ACCESS_TOKEN_NOT_FOUND;
        this.result = Collections.emptyMap();
    }
}
