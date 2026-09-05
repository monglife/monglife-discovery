package com.monglife.discovery.app.common.auth.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.app.common.auth.enums.AuthErrorCode;
import lombok.Getter;

import java.util.Collections;

@Getter
public class SocialAccountMismatchException extends ErrorException {

    public SocialAccountMismatchException() {
        this.errorCode = AuthErrorCode.DISCOVERY_APP_AUTH_SOCIAL_ACCOUNT_MISMATCH;
        this.result = Collections.emptyMap();
    }
}
