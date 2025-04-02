package com.monglife.discovery.app.common.auth.dto.etc;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class VerifyAccessTokenDto {

    private String accessToken;

    @Builder
    public VerifyAccessTokenDto(String accessToken) {
        this.accessToken = accessToken;
    }
}
