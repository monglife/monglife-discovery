package com.monglife.discovery.domain.device.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.domain.device.enums.DeviceErrorCode;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 종료가 시작보다 앞서거나 같을 때.
 *
 * <p>{@code AdminExceptionHandler} 에 걸지 않는다 — {@code CommonExceptionHandler} 가 400 으로 내린다.
 * 입력이 잘못된 것이지 자원이 없거나 충돌한 것이 아니다.
 */
@Getter
public class InvalidMaintenancePeriodException extends ErrorException {

    public InvalidMaintenancePeriodException(LocalDateTime startAt, LocalDateTime endAt) {
        this.errorCode = DeviceErrorCode.DISCOVERY_DEVICE_INVALID_MAINTENANCE_PERIOD;
        // endAt 이 null 이면 애초에 이 예외가 나지 않지만, Map.of 는 null 을 못 받으므로 방어한다
        Map<String, Object> result = new HashMap<>();
        result.put("startAt", String.valueOf(startAt));
        result.put("endAt", String.valueOf(endAt));
        this.result = result;
    }
}
