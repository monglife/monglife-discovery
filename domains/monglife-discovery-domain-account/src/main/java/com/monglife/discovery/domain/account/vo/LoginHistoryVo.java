package com.monglife.discovery.domain.account.vo;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@ToString
@Getter
public class LoginHistoryVo {

    private final Long accountId;

    private final String deviceId;

    private final String appPackageName;

    private final String deviceName;

    private final String buildVersion;

    @Builder
    public LoginHistoryVo(Long accountId, String deviceId, String appPackageName, String deviceName, String buildVersion) {
        this.accountId = accountId;
        this.deviceId = deviceId;
        this.appPackageName = appPackageName;
        this.deviceName = deviceName;
        this.buildVersion = buildVersion;
    }
}
