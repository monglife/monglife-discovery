package com.monglife.discovery.app.common.auth.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class VerifyAccessTokenResponseDto {

    private String accessToken;

    @Builder
    public VerifyAccessTokenResponseDto(String accessToken) {
        this.accessToken = accessToken;
    }
}
