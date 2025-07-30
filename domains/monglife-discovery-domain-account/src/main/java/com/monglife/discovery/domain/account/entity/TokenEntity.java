package com.monglife.discovery.domain.account.entity;

import com.monglife.discovery.domain.account.vo.TokenVo;
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
    private String accessToken;

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
    public TokenEntity(String refreshToken, String accessToken, String deviceId, Long accountId, String appPackageName, String buildVersion, LocalDateTime createdAt, Long expiration) {
        this.refreshToken = refreshToken;
        this.accessToken = accessToken;
        this.deviceId = deviceId;
        this.accountId = accountId;
        this.appPackageName = appPackageName;
        this.buildVersion = buildVersion;
        this.createdAt = createdAt;
        this.expiration = expiration;
    }

    /**
     * 수정
     */
    public void update(TokenVo tokenVo) {
        this.accessToken = tokenVo.getAccessToken();
        this.deviceId = tokenVo.getDeviceId();
        this.accountId = tokenVo.getAccountId();
        this.appPackageName = tokenVo.getAppPackageName();
        this.buildVersion = tokenVo.getBuildVersion();
        this.expiration = tokenVo.getExpiration();
    }
}
