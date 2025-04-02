package com.monglife.discovery.domain.account.vo;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@ToString
@Getter
public class AccountVo {

    private final Long accountId;

    private final String email;

    private final String name;

    private final String socialAccountId;

    private final String role;

    @Builder
    public AccountVo(Long accountId, String email, String name, String socialAccountId, String role) {
        this.accountId = accountId;
        this.email = email;
        this.name = name;
        this.socialAccountId = socialAccountId;
        this.role = role;
    }
}
