package com.monglife.discovery.domain.account.enums;

import com.monglife.core.dto.response.ResponseDto;
import com.monglife.core.enums.response.Response;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.Map;

@Getter
@AllArgsConstructor
public enum AccountResponse implements Response {

    DISCOVERY_ACCOUNT_NOT_EXISTS_SESSION(HttpStatus.UNAUTHORIZED.value(), "DISCOVERY-ACCOUNT-100", "새션이 존재하지 않습니다."),
    DISCOVERY_ACCOUNT_NOT_EXISTS_ACCOUNT(HttpStatus.NOT_FOUND.value(), "DISCOVERY-ACCOUNT-101", "계정이 존재하지 않습니다."),
    ;

    private final Integer httpStatus;

    private final String code;

    private final String message;

    @Override
    public ResponseDto<Map<String, Object>> toResponseDto() {
        return new ResponseDto<>(code, message, httpStatus, Collections.emptyMap());
    }

    @Override
    public <T> ResponseDto<T> toResponseDto(T result) {
        return new ResponseDto<>(code, message, httpStatus, result);
    }
}
