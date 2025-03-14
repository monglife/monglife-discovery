package com.monglife.discovery.app.gateway.global.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.app.gateway.global.response.GatewayResponse;
import lombok.Getter;

import java.util.Collections;

@Getter
public class TokenNotFoundException extends ErrorException {

    public TokenNotFoundException() {
        this.response = GatewayResponse.DISCOVERY_GATEWAY_ACCESS_TOKEN_NOT_FOUND;
        this.result = Collections.emptyMap();
    }
}
