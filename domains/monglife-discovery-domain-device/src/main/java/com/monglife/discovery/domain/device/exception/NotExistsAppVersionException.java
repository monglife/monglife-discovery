package com.monglife.discovery.domain.device.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.domain.device.enums.DeviceErrorCode;
import lombok.Getter;

import java.util.Map;

@Getter
public class NotExistsAppVersionException extends ErrorException {

    public NotExistsAppVersionException(String packageName, String buildVersion) {
        this.errorCode = DeviceErrorCode.DISCOVERY_DEVICE_NOT_EXISTS_APP_VERSION;
        this.result = Map.of("packageName", packageName, "buildVersion", buildVersion);
    }
}
