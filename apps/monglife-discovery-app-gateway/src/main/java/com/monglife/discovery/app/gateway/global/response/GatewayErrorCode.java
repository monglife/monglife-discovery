package com.monglife.discovery.app.gateway.global.response;

import com.monglife.core.enums.error.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum GatewayErrorCode implements ErrorCode {

    DISCOVERY_GATEWAY_ACCESS_TOKEN_NOT_FOUND("DISCOVERY-GATEWAY-100", "access token 이 없습니다."),
    DISCOVERY_GATEWAY_ACCESS_TOKEN_EXPIRED("DISCOVERY-GATEWAY-101", "만료된 access token 입니다."),
    DISCOVERY_GATEWAY_PASSPORT_GENERATE_FAIL("DISCOVERY-GATEWAY-102", "passport 생성에 실패했습니다."),
    DISCOVERY_GATEWAY_CONNECT_FAIL("DISCOVERY-GATEWAY-103", "서비스에 접근할 수 없습니다."),
    DISCOVERY_GATEWAY_NOT_FOUND("DISCOVERY-GATEWAY-104", "리소스에 접근할 수 없습니다."),
    ;

    private final String code;

    private final String message;
}
