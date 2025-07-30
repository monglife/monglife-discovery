package com.monglife.discovery.app.gateway.global.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.app.gateway.global.response.GatewayErrorCode;
import lombok.Getter;

import java.util.Collections;

@Getter
public class PassportGenerateException extends ErrorException {

    public PassportGenerateException(String accessToken) {
        this.errorCode = GatewayErrorCode.DISCOVERY_GATEWAY_PASSPORT_GENERATE_FAIL;
        this.result = Collections.singletonMap("access_token", accessToken);
    }
}
