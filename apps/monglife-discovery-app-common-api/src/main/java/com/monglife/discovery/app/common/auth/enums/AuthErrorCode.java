package com.monglife.discovery.app.common.auth.enums;

import com.monglife.core.enums.error.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum AuthErrorCode implements ErrorCode {

    DISCOVERY_APP_AUTH_ACCESS_TOKEN_EXPIRED("DISCOVERY-APP-AUTH-100", "만료된 토큰입니다."),
    ;

    private final String code;

    private final String message;
}
