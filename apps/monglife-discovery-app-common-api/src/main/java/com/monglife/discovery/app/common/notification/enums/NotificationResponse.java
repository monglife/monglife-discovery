package com.monglife.discovery.app.common.notification.enums;

import com.monglife.core.enums.response.Response;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum NotificationResponse implements Response {

    DISCOVERY_APP_NOTIFICATION(HttpStatus.OK.value(), "DISCOVERY-APP-NOTIFICATION-000", "알림 전송에 성공했습니다."),
    ;

    private final Integer httpStatus;

    private final String code;

    private final String message;
}
