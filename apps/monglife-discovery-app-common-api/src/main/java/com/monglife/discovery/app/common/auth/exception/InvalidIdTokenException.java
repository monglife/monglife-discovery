package com.monglife.discovery.app.common.auth.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.app.common.auth.enums.AuthErrorCode;
import lombok.Getter;

import java.util.Collections;

@Getter
public class InvalidIdTokenException extends ErrorException {

    public InvalidIdTokenException() {
        this.errorCode = AuthErrorCode.DISCOVERY_APP_AUTH_INVALID_ID_TOKEN;
        this.result = Collections.emptyMap();
    }
}
