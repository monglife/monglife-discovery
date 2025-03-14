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
public class LoginRequestDto {

    @NotEmpty
    @NotBlank
    private String deviceId;

    @NotEmpty
    @NotBlank
    @Email
    private String email;

    @NotEmpty
    @NotBlank
    private String socialAccountId;

    @NotEmpty
    @NotBlank
    private String appPackageName;

    @NotEmpty
    @NotBlank
    private String deviceName;

    @NotEmpty
    @NotBlank
    private String buildVersion;

    @Builder
    public LoginRequestDto(String deviceId, String email, String socialAccountId, String appPackageName, String buildVersion) {
        this.deviceId = deviceId;
        this.email = email;
        this.socialAccountId = socialAccountId;
        this.appPackageName = appPackageName;
        this.buildVersion = buildVersion;
    }
}
