package com.monglife.discovery.app.common.admin.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * 계정 ID 로 이름표만 얻어 가는 용도. 다른 서비스(mongs)의 관리 화면이 계정 ID 만 들고 있어서
 * 목록에 이메일을 함께 보여 주려면 이 조회가 필요하다. 목록에 쓰이므로 민감한 값은 담지 않는다.
 */
@Getter
public class AdminAccountSummaryResponseDto {

    private final Long accountId;

    private final String email;

    private final String name;

    private final Boolean isDeleted;

    @Builder
    public AdminAccountSummaryResponseDto(Long accountId, String email, String name, Boolean isDeleted) {
        this.accountId = accountId;
        this.email = email;
        this.name = name;
        this.isDeleted = isDeleted;
    }
}
