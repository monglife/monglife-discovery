package com.monglife.discovery.domain.device.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.domain.device.enums.DeviceErrorCode;
import lombok.Getter;

import java.util.Map;

@Getter
public class NotExistsMaintenanceException extends ErrorException {

    public NotExistsMaintenanceException(Long maintenanceId) {
        this.errorCode = DeviceErrorCode.DISCOVERY_DEVICE_NOT_EXISTS_MAINTENANCE;
        this.result = Map.of("maintenanceId", maintenanceId);
    }
}
