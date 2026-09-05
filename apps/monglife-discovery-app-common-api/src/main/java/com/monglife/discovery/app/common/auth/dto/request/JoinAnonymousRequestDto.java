package com.monglife.discovery.app.common.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class JoinAnonymousRequestDto {

    @NotEmpty
    @NotBlank
    @Email
    private String deviceId;

    @Builder
    public JoinAnonymousRequestDto(String deviceId) {
        this.deviceId = deviceId;
    }
}
