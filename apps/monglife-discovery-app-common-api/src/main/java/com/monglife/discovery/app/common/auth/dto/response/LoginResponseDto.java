package com.monglife.discovery.app.common.auth.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class LoginResponseDto {

    private Long accountId;

    private String accessToken;

    private String refreshToken;

    @Builder
    public LoginResponseDto(Long accountId, String accessToken, String refreshToken) {
        this.accountId = accountId;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}
