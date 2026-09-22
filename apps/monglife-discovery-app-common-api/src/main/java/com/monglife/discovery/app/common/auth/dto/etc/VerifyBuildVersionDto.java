package com.monglife.discovery.app.common.auth.dto.etc;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class VerifyBuildVersionDto {

    private String appPackageName;

    private String buildVersion;

    private Boolean mustUpdate;

    /** 서버 점검 중인지. 점검 중이 아니면 아래 셋은 전부 null 이다 */
    private Boolean underMaintenance;

    private String maintenanceMessage;

    private LocalDateTime maintenanceStartAt;

    private LocalDateTime maintenanceEndAt;

    @Builder
    public VerifyBuildVersionDto(String appPackageName, String buildVersion, Boolean mustUpdate, Boolean underMaintenance, String maintenanceMessage, LocalDateTime maintenanceStartAt, LocalDateTime maintenanceEndAt) {
        this.appPackageName = appPackageName;
        this.buildVersion = buildVersion;
        this.mustUpdate = mustUpdate;
        this.underMaintenance = underMaintenance;
        this.maintenanceMessage = maintenanceMessage;
        this.maintenanceStartAt = maintenanceStartAt;
        this.maintenanceEndAt = maintenanceEndAt;
    }
}
