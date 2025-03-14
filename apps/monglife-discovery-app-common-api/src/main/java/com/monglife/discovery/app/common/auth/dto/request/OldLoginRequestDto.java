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
public class OldLoginRequestDto {

    @NotEmpty
    @NotBlank
    private String deviceId;

    @NotEmpty
    @NotBlank
    @Email
    private String email;

    @NotEmpty
    @NotBlank
    private String name;

    @Builder
    public OldLoginRequestDto(String deviceId, String email, String name) {
        this.deviceId = deviceId;
        this.email = email;
        this.name = name;
    }
}
