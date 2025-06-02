package com.monglife.discovery.app.common.auth.enums;

import com.monglife.core.dto.response.ResponseDto;
import com.monglife.core.enums.response.Response;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.Map;

@Getter
@AllArgsConstructor
public enum AuthResponse implements Response {

    DISCOVERY_APP_AUTH_JOIN(HttpStatus.OK.value(), "DISCOVERY-APP-AUTH-000", "회원가입에 성공하였습니다."),
    DISCOVERY_APP_AUTH_LOGIN(HttpStatus.OK.value(), "DISCOVERY-APP-AUTH-001", "로그인에 성공하였습니다."),
    DISCOVERY_APP_AUTH_LOGOUT(HttpStatus.OK.value(), "DISCOVERY-APP-AUTH-002", "로그아웃에 성공하였습니다."),
    DISCOVERY_APP_AUTH_REISSUE(HttpStatus.OK.value(), "DISCOVERY-APP-AUTH-003", "토큰 재발급에 성공하였습니다."),
    DISCOVERY_APP_AUTH_VALIDATION_TOKEN(HttpStatus.OK.value(), "DISCOVERY-APP-AUTH-004", "토큰 유효성 체크에 성공하였습니다."),
    DISCOVERY_APP_AUTH_GET_PASSPORT(HttpStatus.OK.value(), "DISCOVERY-APP-AUTH-005", "패스포트 발급에 성공하였습니다."),
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
