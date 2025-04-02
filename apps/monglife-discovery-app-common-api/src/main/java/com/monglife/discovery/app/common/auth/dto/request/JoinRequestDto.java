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
public class JoinRequestDto {

    @NotEmpty
    @NotBlank
    @Email
    private String email;

    @NotEmpty
    @NotBlank
    private String name;

    @NotEmpty
    @NotBlank
    private String socialAccountId;

    @Builder
    public JoinRequestDto(String deviceId, String email, String name, String socialAccountId) {
        this.email = email;
        this.name = name;
        this.socialAccountId = socialAccountId;
    }
}
