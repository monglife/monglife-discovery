package com.monglife.discovery.domain.account.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.domain.account.enums.AccountErrorCode;
import lombok.Getter;

import java.util.Collections;

@Getter
public class AlreadyExistsAccountException extends ErrorException {

    public AlreadyExistsAccountException() {
        this.errorCode = AccountErrorCode.DISCOVERY_ACCOUNT_ALREADY_EXISTS_ACCOUNT;
        this.result = Collections.emptyMap();
    }
}
