package com.monglife.discovery.app.common.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReissueRequestDto {

    @NotEmpty
    @NotBlank
    private String refreshToken;

    @Builder
    public ReissueRequestDto(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}