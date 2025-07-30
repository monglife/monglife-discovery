package com.monglife.discovery.domain.account.enums;

import com.monglife.core.enums.error.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum AccountErrorCode implements ErrorCode {

    DISCOVERY_ACCOUNT_NOT_EXISTS_SESSION("DISCOVERY-ACCOUNT-100", "새션이 존재하지 않습니다."),
    DISCOVERY_ACCOUNT_NOT_EXISTS_ACCOUNT("DISCOVERY-ACCOUNT-101", "계정이 존재하지 않습니다."),
    DISCOVERY_ACCOUNT_ALREADY_EXISTS_ACCOUNT("DISCOVERY-ACCOUNT-102", "이미 계정이 존재합니다."),
    ;

    private final String code;

    private final String message;
}
