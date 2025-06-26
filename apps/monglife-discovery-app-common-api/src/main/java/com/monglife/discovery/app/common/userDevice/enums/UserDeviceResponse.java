package com.monglife.discovery.app.common.userDevice.enums;

import com.monglife.core.enums.response.Response;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum UserDeviceResponse implements Response {

    DISCOVERY_APP_USER_DEVICE_CREATE_DEVICE(HttpStatus.OK.value(), "DISCOVERY-APP-USER-DEVICE-000", "기기 등록에 성공했습니다."),
    ;

    private final Integer httpStatus;

    private final String code;

    private final String message;
}
