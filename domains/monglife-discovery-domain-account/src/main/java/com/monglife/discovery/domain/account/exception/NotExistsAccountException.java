package com.monglife.discovery.domain.account.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.domain.account.enums.AccountResponse;
import lombok.Getter;

import java.util.Collections;

@Getter
public class NotExistsAccountException extends ErrorException {

    public NotExistsAccountException() {
        this.response = AccountResponse.DISCOVERY_ACCOUNT_NOT_EXISTS_ACCOUNT;
        this.result = Collections.emptyMap();
    }

    public NotExistsAccountException(Long accountId) {
        this.response = AccountResponse.DISCOVERY_ACCOUNT_NOT_EXISTS_ACCOUNT;
        this.result = Collections.singletonMap("accountId", accountId);
    }

    public NotExistsAccountException(String socialAccountId) {
        this.response = AccountResponse.DISCOVERY_ACCOUNT_NOT_EXISTS_ACCOUNT;
        this.result = Collections.singletonMap("socialAccountId", socialAccountId);
    }
}
