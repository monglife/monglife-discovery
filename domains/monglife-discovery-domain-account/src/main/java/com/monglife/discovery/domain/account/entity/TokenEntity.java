package com.monglife.discovery.domain.account.entity;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;
import org.springframework.data.redis.core.index.Indexed;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@RedisHash("monglife_token")
public class TokenEntity {

    @Id
    private String refreshToken;

    @Indexed
    private String deviceId;

    @Indexed
    private Long accountId;

    private String appPackageName;

    private String buildVersion;

    private LocalDateTime createdAt;

    @TimeToLive
    private Long expiration;

    @Builder
    public TokenEntity(String refreshToken, String deviceId, Long accountId, String appPackageName, String buildVersion, LocalDateTime createdAt, Long expiration) {
        this.refreshToken = refreshToken;
        this.deviceId = deviceId;
        this.accountId = accountId;
        this.appPackageName = appPackageName;
        this.buildVersion = buildVersion;
        this.createdAt = createdAt;
        this.expiration = expiration;
    }
}
