package com.monglife.discovery.app.common.admin.exception;

import com.monglife.core.dto.response.ResponseDto;
import com.monglife.discovery.app.common.admin.controller.AdminAccountController;
import com.monglife.discovery.domain.account.exception.NotExistsAccountException;
import com.monglife.discovery.domain.account.exception.NotExistsTokenException;
import com.monglife.discovery.domain.device.exception.AlreadyExistsAppVersionException;
import com.monglife.discovery.domain.device.exception.NotExistsAppVersionException;
import com.monglife.discovery.domain.device.exception.NotExistsDeviceException;
import com.monglife.discovery.domain.device.exception.NotExistsMaintenanceException;
import com.monglife.discovery.domain.feedback.exception.NotExistsFeedbackException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * admin.controller 패키지 한정. "없음" 은 404, 중복은 409. 나머지 ErrorException 은 CommonExceptionHandler 가 400.
 * 401 은 앱의 전역 인터셉터와 충돌하므로 쓰지 않는다.
 */
@RestControllerAdvice(basePackageClasses = AdminAccountController.class)
public class AdminExceptionHandler {

    @ExceptionHandler({
            NotExistsAccountException.class,
            NotExistsDeviceException.class,
            NotExistsAppVersionException.class,
            NotExistsFeedbackException.class,
            NotExistsMaintenanceException.class,
            NotExistsTokenException.class
    })
    private ResponseEntity<ResponseDto<Map<String, Object>>> handleNotFound(com.monglife.core.exception.ErrorException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND.value())
                .body(e.getErrorCode().toResponseDto(HttpStatus.NOT_FOUND.value(), e.getResult()));
    }

    @ExceptionHandler(AlreadyExistsAppVersionException.class)
    private ResponseEntity<ResponseDto<Map<String, Object>>> handleConflict(AlreadyExistsAppVersionException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT.value())
                .body(e.getErrorCode().toResponseDto(HttpStatus.CONFLICT.value(), e.getResult()));
    }
}
