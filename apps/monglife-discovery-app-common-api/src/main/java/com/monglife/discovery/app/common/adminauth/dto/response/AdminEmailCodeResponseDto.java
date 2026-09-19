package com.monglife.discovery.app.common.adminauth.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
public class AdminEmailCodeResponseDto {

    private final long expiresIn;

    private final long resendAfter;

    /** true 면 코드가 발송되지 않았고, 아무 코드로 verify 를 호출하면 된다 (local/dev) */
    private final boolean skipVerify;

    @Builder
    public AdminEmailCodeResponseDto(long expiresIn, long resendAfter, boolean skipVerify) {
        this.expiresIn = expiresIn;
        this.resendAfter = resendAfter;
        this.skipVerify = skipVerify;
    }
}
