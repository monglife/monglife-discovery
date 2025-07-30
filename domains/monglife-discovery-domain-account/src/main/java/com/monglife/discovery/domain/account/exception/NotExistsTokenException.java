package com.monglife.discovery.domain.account.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.domain.account.enums.AccountErrorCode;
import lombok.Getter;

import java.util.Collections;

@Getter
public class NotExistsTokenException extends ErrorException {

    public NotExistsTokenException(String refreshToken) {
        this.errorCode = AccountErrorCode.DISCOVERY_ACCOUNT_NOT_EXISTS_SESSION;
        this.result = Collections.singletonMap("refreshToken", refreshToken);
    }
}
