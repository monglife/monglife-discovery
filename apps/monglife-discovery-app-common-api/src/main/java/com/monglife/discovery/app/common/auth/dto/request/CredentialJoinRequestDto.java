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
public class CredentialJoinRequestDto {

    /**
     * 참고값. 가입에 쓰는 email 은 검증된 idToken 의 email 클레임이다
     */
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

    @NotEmpty
    @NotBlank
    private String idToken;

    @Builder
    public CredentialJoinRequestDto(String email, String name, String socialAccountId, String idToken) {
        this.email = email;
        this.name = name;
        this.socialAccountId = socialAccountId;
        this.idToken = idToken;
    }
}
