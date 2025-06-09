package com.monglife.discovery.app.common.auth.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class VerifyBuildVersionResponseDto {

    private String appPackageName;

    private String buildVersion;

    private Boolean mustUpdate;

    @Builder
    public VerifyBuildVersionResponseDto(String appPackageName, String buildVersion, Boolean mustUpdate) {
        this.appPackageName = appPackageName;
        this.buildVersion = buildVersion;
        this.mustUpdate = mustUpdate;
    }
}
