package com.monglife.discovery.app.common.auth.dto.etc;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReissueDto {

    private String accessToken;

    private String refreshToken;

    @Builder
    public ReissueDto(String accessToken, String refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}
