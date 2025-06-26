package com.monglife.discovery.app.common.auth.exception;

import com.monglife.core.dto.response.ResponseDto;
import com.monglife.discovery.app.common.auth.controller.AuthController;
import com.monglife.discovery.domain.account.exception.AlreadyExistsAccountException;
import com.monglife.discovery.domain.account.exception.NotExistsAccountException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice(basePackageClasses = AuthController.class)
public class AuthExceptionHandler {

    /**
     * 계정 없음 예외 처리 응답
     */
    @ExceptionHandler(NotExistsAccountException.class)
    private ResponseEntity<ResponseDto<Map<String, Object>>> handleNotExistsAccountException(NotExistsAccountException e) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND.value())
                .body(e.getErrorCode().toResponseDto(HttpStatus.NOT_FOUND.value(), e.getResult()));
    }

    /**
     * 계정 존재 예외 처리 응답
     */
    @ExceptionHandler(AlreadyExistsAccountException.class)
    private ResponseEntity<ResponseDto<Map<String, Object>>> handleAlreadyExistsAccountException(AlreadyExistsAccountException e) {
        return ResponseEntity
                .status(HttpStatus.NOT_ACCEPTABLE.value())
                .body(e.getErrorCode().toResponseDto(HttpStatus.NOT_ACCEPTABLE.value(), e.getResult()));
    }
}