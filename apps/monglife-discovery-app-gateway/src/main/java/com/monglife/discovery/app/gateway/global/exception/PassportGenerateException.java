package com.monglife.discovery.app.gateway.global.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.app.gateway.global.response.GatewayResponse;
import lombok.Getter;

import java.util.Collections;

@Getter
public class PassportGenerateException extends ErrorException {

    public PassportGenerateException(String accessToken) {
        this.response = GatewayResponse.DISCOVERY_GATEWAY_PASSPORT_GENERATE_FAIL;
        this.result = Collections.singletonMap("access_token", accessToken);
    }
}
