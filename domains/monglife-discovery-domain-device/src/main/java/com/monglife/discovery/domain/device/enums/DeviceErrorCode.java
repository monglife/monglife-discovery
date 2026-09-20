package com.monglife.discovery.domain.device.enums;

import com.monglife.core.enums.error.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum DeviceErrorCode implements ErrorCode {

    DISCOVERY_DEVICE_NOT_EXISTS_APP_VERSION("DISCOVERY-DEVICE-100", "앱 버전이 존재하지 않습니다."),
    DISCOVERY_DEVICE_NOT_EXISTS_DEVICE("DISCOVERY-DEVICE-101", "기기 정보가 존재하지 않습니다."),
    DISCOVERY_DEVICE_ALREADY_EXISTS_APP_VERSION("DISCOVERY-DEVICE-102", "이미 등록된 앱 버전입니다."),
    DISCOVERY_DEVICE_NOT_EXISTS_MAINTENANCE("DISCOVERY-DEVICE-103", "점검 일정이 존재하지 않습니다."),
    DISCOVERY_DEVICE_INVALID_MAINTENANCE_PERIOD("DISCOVERY-DEVICE-104", "점검 종료 시각은 시작 시각보다 뒤여야 합니다."),
    ;

    private final String code;

    private final String message;
}
