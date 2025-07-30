package com.monglife.discovery.domain.device.enums;

import com.monglife.core.enums.error.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum DeviceErrorCode implements ErrorCode {

    DISCOVERY_DEVICE_NOT_EXISTS_APP_VERSION("DISCOVERY-DEVICE-100", "앱 버전이 존재하지 않습니다."),
    DISCOVERY_DEVICE_NOT_EXISTS_DEVICE("DISCOVERY-DEVICE-101", "기기 정보가 존재하지 않습니다."),
    ;

    private final String code;

    private final String message;
}
