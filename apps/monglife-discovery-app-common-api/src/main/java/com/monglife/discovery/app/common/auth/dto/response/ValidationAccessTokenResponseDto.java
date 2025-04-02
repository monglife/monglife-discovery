package com.monglife.discovery.app.common.auth.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ValidationAccessTokenResponseDto {

    private String accessToken;

    @Builder
    public ValidationAccessTokenResponseDto(String accessToken) {
        this.accessToken = accessToken;
    }
}
