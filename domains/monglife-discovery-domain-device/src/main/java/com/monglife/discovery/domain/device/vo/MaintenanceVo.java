package com.monglife.discovery.domain.device.vo;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class MaintenanceVo {

    private final Long maintenanceId;

    /** 점검 대상 앱. null 이면 전역이라 모든 앱이 막힌다 */
    private final String appPackageName;

    private final String message;

    private final LocalDateTime startAt;

    private final LocalDateTime endAt;

    private final Boolean enabled;

    /** 조회 시점에 점검 중이었는지. 엔티티 컬럼이 아니라 계산값이다 */
    private final Boolean active;

    private final LocalDateTime createdAt;

    private final LocalDateTime updatedAt;

    @Builder
    public MaintenanceVo(Long maintenanceId, String appPackageName, String message, LocalDateTime startAt, LocalDateTime endAt, Boolean enabled, Boolean active, LocalDateTime createdAt, LocalDateTime updatedAt) {
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
