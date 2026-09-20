package com.monglife.discovery.app.common.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class VerifyBuildVersionResponseDto {

    private String appPackageName;

    private String buildVersion;

    private Boolean mustUpdate;

    /**
     * 서버 점검 중인지.
     *
     * <p>점검이라고 로그인을 막지는 않는다. 멈출지는 앱이 판단한다.
     * 점검 중이 아니면 아래 셋은 전부 null 이다.
     */
    private Boolean underMaintenance;

    private String maintenanceMessage;

    // 기본 ObjectMapper 가 날짜를 배열로 내보내므로 ISO 문자열로 고정한다
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime maintenanceStartAt;

    // 기본 ObjectMapper 가 날짜를 배열로 내보내므로 ISO 문자열로 고정한다
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime maintenanceEndAt;

    @Builder
    public VerifyBuildVersionResponseDto(String appPackageName, String buildVersion, Boolean mustUpdate, Boolean underMaintenance, String maintenanceMessage, LocalDateTime maintenanceStartAt, LocalDateTime maintenanceEndAt) {
        this.appPackageName = appPackageName;
        this.buildVersion = buildVersion;
        this.mustUpdate = mustUpdate;
        this.underMaintenance = underMaintenance;
        this.maintenanceMessage = maintenanceMessage;
        this.maintenanceStartAt = maintenanceStartAt;
        this.maintenanceEndAt = maintenanceEndAt;
    }
}
