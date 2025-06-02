package com.monglife.discovery.domain.device.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.domain.device.enums.DeviceErrorCode;
import lombok.Getter;

import java.util.Map;

@Getter
public class NotExistsDeviceException extends ErrorException {

    public NotExistsDeviceException(String deviceId) {
        this.errorCode = DeviceErrorCode.DISCOVERY_DEVICE_NOT_EXISTS_DEVICE;
        this.result = Map.of("deviceId", deviceId);
    }
}
