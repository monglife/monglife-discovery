package com.monglife.discovery.app.common.admin.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AdminMaintenanceResponseDto {

    private final Long maintenanceId;

    /** 점검 대상 앱. null 이면 전역이라 모든 앱이 막힌다 */
    private final String appPackageName;

    private final String message;

    // 기본 ObjectMapper 가 날짜를 배열로 내보내므로 ISO 문자열로 고정한다
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private final LocalDateTime startAt;

    // 기본 ObjectMapper 가 날짜를 배열로 내보내므로 ISO 문자열로 고정한다
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private final LocalDateTime endAt;

    private final Boolean enabled;

    /** 조회 시점에 점검 중이었는지. 서버 시계 기준이라 화면이 따로 계산하지 않아도 된다 */
    private final Boolean active;

    // 기본 ObjectMapper 가 날짜를 배열로 내보내므로 ISO 문자열로 고정한다
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private final LocalDateTime createdAt;

    // 기본 ObjectMapper 가 날짜를 배열로 내보내므로 ISO 문자열로 고정한다
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private final LocalDateTime updatedAt;

    @Builder
    public AdminMaintenanceResponseDto(Long maintenanceId, String appPackageName, String message, LocalDateTime startAt, LocalDateTime endAt, Boolean enabled, Boolean active, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.maintenanceId = maintenanceId;
        this.appPackageName = appPackageName;
        this.message = message;
        this.startAt = startAt;
        this.endAt = endAt;
        this.enabled = enabled;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
