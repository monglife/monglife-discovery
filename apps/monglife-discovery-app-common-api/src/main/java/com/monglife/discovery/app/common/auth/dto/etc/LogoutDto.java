package com.monglife.discovery.app.common.auth.dto.etc;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class LogoutDto {

    private Long accountId;

    private String deviceId;

    @Builder
    public LogoutDto(Long accountId, String deviceId) {
        this.accountId = accountId;
        this.deviceId = deviceId;
    }
}
