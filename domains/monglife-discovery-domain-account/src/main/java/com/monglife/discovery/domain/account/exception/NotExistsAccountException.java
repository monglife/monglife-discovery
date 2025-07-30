package com.monglife.discovery.domain.account.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.domain.account.enums.AccountErrorCode;
import lombok.Getter;

import java.util.Collections;

@Getter
public class NotExistsAccountException extends ErrorException {

    public NotExistsAccountException() {
        this.errorCode = AccountErrorCode.DISCOVERY_ACCOUNT_NOT_EXISTS_ACCOUNT;
        this.result = Collections.emptyMap();
    }

    public NotExistsAccountException(Long accountId) {
        this.errorCode = AccountErrorCode.DISCOVERY_ACCOUNT_NOT_EXISTS_ACCOUNT;
        this.result = Collections.singletonMap("accountId", accountId);
    }

    public NotExistsAccountException(String socialAccountId) {
        this.errorCode = AccountErrorCode.DISCOVERY_ACCOUNT_NOT_EXISTS_ACCOUNT;
        this.result = Collections.singletonMap("socialAccountId", socialAccountId);
    }
}
