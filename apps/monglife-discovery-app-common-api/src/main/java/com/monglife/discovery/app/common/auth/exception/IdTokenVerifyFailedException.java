package com.monglife.discovery.app.common.auth.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.app.common.auth.enums.AuthErrorCode;
import lombok.Getter;

import java.util.Collections;

@Getter
public class IdTokenVerifyFailedException extends ErrorException {

    public IdTokenVerifyFailedException() {
        this.errorCode = AuthErrorCode.DISCOVERY_APP_AUTH_ID_TOKEN_VERIFY_FAILED;
        this.result = Collections.emptyMap();
    }
}
