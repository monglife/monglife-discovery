package com.monglife.discovery.app.common.auth.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class CredentialLoginRequestDto {

    @NotEmpty
    @NotBlank
    private String deviceId;

    /**
     * 참고값. 계정 조회는 검증된 idToken 의 email 클레임으로 한다
     */
    @NotEmpty
    @NotBlank
    @Email
    private String email;

    @NotEmpty
    @NotBlank
    private String socialAccountId;

    @NotEmpty
    @NotBlank
    private String idToken;

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
    public CredentialLoginRequestDto(String deviceId, String email, String socialAccountId, String idToken, String appPackageName, String deviceName, String buildVersion) {
        this.deviceId = deviceId;
        this.email = email;
        this.socialAccountId = socialAccountId;
        this.idToken = idToken;
        this.appPackageName = appPackageName;
        this.deviceName = deviceName;
        this.buildVersion = buildVersion;
    }
}
