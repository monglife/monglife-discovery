package com.monglife.discovery.domain.device.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.domain.device.enums.DeviceResponse;
import lombok.Getter;

import java.util.Map;

@Getter
public class NotExistsDeviceException extends ErrorException {

    public NotExistsDeviceException(String deviceId) {
        this.response = DeviceResponse.DISCOVERY_DEVICE_NOT_EXISTS_DEVICE;
        this.result = Map.of("deviceId", deviceId);
    }
}
