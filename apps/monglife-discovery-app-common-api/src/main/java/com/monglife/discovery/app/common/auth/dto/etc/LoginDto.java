package com.monglife.discovery.app.common.auth.dto.etc;


import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class LoginDto {

    private Long accountId;

    private String accessToken;

    private String refreshToken;

    @Builder
    public LoginDto(Long accountId, String accessToken, String refreshToken) {
        this.accountId = accountId;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}
