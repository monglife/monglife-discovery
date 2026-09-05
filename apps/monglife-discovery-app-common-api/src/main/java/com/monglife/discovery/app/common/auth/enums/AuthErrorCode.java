package com.monglife.discovery.app.common.auth.enums;

import com.monglife.core.enums.error.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum AuthErrorCode implements ErrorCode {

    DISCOVERY_APP_AUTH_ACCESS_TOKEN_EXPIRED("DISCOVERY-APP-AUTH-100", "만료된 토큰입니다."),
    DISCOVERY_APP_AUTH_NEED_UPDATE_APP("DISCOVERY-APP-AUTH-101", "앱 업데이트가 필요합니다."),
    DISCOVERY_APP_AUTH_INVALID_ID_TOKEN("DISCOVERY-APP-AUTH-102", "유효하지 않은 ID 토큰입니다."),
    DISCOVERY_APP_AUTH_ID_TOKEN_VERIFY_FAILED("DISCOVERY-APP-AUTH-103", "ID 토큰 검증에 실패했습니다."),
    DISCOVERY_APP_AUTH_SOCIAL_ACCOUNT_MISMATCH("DISCOVERY-APP-AUTH-104", "요청 정보가 ID 토큰과 일치하지 않습니다."),
    ;

    private final String code;

    private final String message;
}
