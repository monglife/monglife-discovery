package com.monglife.discovery.domain.account.enums;

import com.monglife.core.dto.response.ResponseDto;
import com.monglife.core.enums.error.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Collections;
import java.util.Map;

@Getter
@AllArgsConstructor
public enum AccountErrorCode implements ErrorCode {

    DISCOVERY_ACCOUNT_NOT_EXISTS_SESSION("DISCOVERY-ACCOUNT-100", "새션이 존재하지 않습니다."),
    DISCOVERY_ACCOUNT_NOT_EXISTS_ACCOUNT("DISCOVERY-ACCOUNT-101", "계정이 존재하지 않습니다."),
    ;

    private final String code;

    private final String message;

    @Override
    public ResponseDto<Map<String, Object>> toResponseDto(Integer httpStatus) {
        return new ResponseDto<>(code, message, httpStatus, Collections.emptyMap());
    }

    @Override
    public <T> ResponseDto<T> toResponseDto(Integer httpStatus, T result) {
        return new ResponseDto<>(code, message, httpStatus, result);
    }
}
