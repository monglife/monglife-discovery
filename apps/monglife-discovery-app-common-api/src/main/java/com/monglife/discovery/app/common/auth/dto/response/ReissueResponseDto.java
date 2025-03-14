package com.monglife.discovery.app.common.auth.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReissueResponseDto {

    private String accessToken;

    private String refreshToken;

    @Builder
    public ReissueResponseDto(String accessToken, String refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}
