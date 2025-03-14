package com.monglife.discovery.domain.device.vo;

import lombok.Builder;
import lombok.Getter;

@Getter
public class AppVersionVo {

    private final Long appVersionId;

    private final String appPackageName;

    private final String buildVersion;

    private final Boolean mustUpdate;

    @Builder
    public AppVersionVo(Long appVersionId, String appPackageName, String buildVersion, Boolean mustUpdate) {
        this.appVersionId = appVersionId;
        this.appPackageName = appPackageName;
        this.buildVersion = buildVersion;
        this.mustUpdate = mustUpdate;
    }
}
