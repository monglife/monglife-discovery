package com.monglife.discovery.domain.account.vo;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class TokenVo {

    private final String refreshToken;

    private final String accessToken;

    private final String deviceId;

    private final Long accountId;

    private final String appPackageName;

    private final String buildVersion;

    private final LocalDateTime createdAt;

    private final Long expiration;

    @Builder
    public TokenVo(String refreshToken, String accessToken, String deviceId, Long accountId, String appPackageName, String buildVersion, LocalDateTime createdAt, Long expiration) {
        this.refreshToken = refreshToken;
        this.accessToken = accessToken;
        this.deviceId = deviceId;
        this.accountId = accountId;
        this.appPackageName = appPackageName;
        this.buildVersion = buildVersion;
        this.createdAt = createdAt;
        this.expiration = expiration;
    }
}
