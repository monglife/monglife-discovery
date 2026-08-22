package com.monglife.discovery.app.common.global.vo;

import lombok.Builder;
import lombok.Getter;

@Getter
public class GoogleIdentityVo {

    private final String email;

    private final String socialAccountId;

    private final String name;

    private final Boolean emailVerified;

    @Builder
    public GoogleIdentityVo(String email, String socialAccountId, String name, Boolean emailVerified) {
        this.email = email;
        this.socialAccountId = socialAccountId;
        this.name = name;
        this.emailVerified = emailVerified;
    }
}
