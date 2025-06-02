package com.monglife.discovery.app.common.global.exception;

import com.monglife.core.dto.response.ResponseDto;
import com.monglife.core.enums.response.GlobalResponse;
import com.monglife.core.exception.ErrorException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

@RestControllerAdvice
public class CommonExceptionHandler {

    /**
     * 사용자 정의 공통 예외 클래스 처리 핸들러
     * @param e 예외 객체
     * @return 에러 응답 객체
     */
    @ExceptionHandler(ErrorException.class)
    private ResponseEntity<ResponseDto<Map<String, Object>>> handleErrorException(ErrorException e) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST.value())
                .body(e.getErrorCode().toResponseDto(HttpStatus.BAD_REQUEST.value(), e.getResult()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ResponseDto<Map<String, Object>>> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {

        BindingResult bindingResult = e.getBindingResult();

        Set<String> errorFields = new LinkedHashSet<>();

        StringBuilder messageBuilder = new StringBuilder();
        for (FieldError fieldError : bindingResult.getFieldErrors()) {
            messageBuilder.append("'");
            messageBuilder.append(fieldError.getField());
            messageBuilder.append("'(은)는 ");
            messageBuilder.append(fieldError.getDefaultMessage());
            messageBuilder.append(". ");

            errorFields.add(fieldError.getField());
        }

        String message = messageBuilder.toString();

        return ResponseEntity
                .status(GlobalResponse.INVALID_PARAMETER.getHttpStatus())
                .body(GlobalResponse.INVALID_PARAMETER.toResponseDto(Map.of("message", message, "errorFields", errorFields)));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ResponseDto<Map<String, Object>>> handleConstraintViolationException(ConstraintViolationException e) {

        Set<ConstraintViolation<?>> bindingResult = e.getConstraintViolations();

        Set<String> errorFields = new LinkedHashSet<>();

        StringBuilder messageBuilder = new StringBuilder();
        for (ConstraintViolation<?> fieldError : bindingResult) {

            String[] pathParts = fieldError.getPropertyPath().toString().split("\\.");
            String fieldName = pathParts[pathParts.length - 1];

            messageBuilder.append("'");
            messageBuilder.append(fieldName);
            messageBuilder.append("'(은)는 ");
            messageBuilder.append(fieldError.getMessage());
            messageBuilder.append(". ");

            errorFields.add(fieldName);
        }

        String message = messageBuilder.toString();

        return ResponseEntity
                .status(GlobalResponse.INVALID_PARAMETER.getHttpStatus())
                .body(GlobalResponse.INVALID_PARAMETER.toResponseDto(Map.of("message", message, "errorFields", errorFields)));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ResponseDto<Map<String, Object>>> handleMissingServletRequestParameterException(MissingServletRequestParameterException e) {

        String parameterName = e.getParameterName();

        String message = parameterName + "(은)는 필수 파라미터 입니다.";

        return ResponseEntity
                .status(GlobalResponse.INVALID_PARAMETER.getHttpStatus())
                .body(GlobalResponse.INVALID_PARAMETER.toResponseDto(Map.of("message", message)));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ResponseDto<Map<String, Object>>> handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException e) {

        String parameterName = e.getPropertyName();

        String message = parameterName + "의 타입";

        if (e.getRequiredType() != null) {
            message += "은 '" + e.getRequiredType().getSimpleName() + "' 이여야 합니다.";
        } else {
            message += "이 적절하지 않습니다.";
        }

        return ResponseEntity
                .status(GlobalResponse.INVALID_PARAMETER.getHttpStatus())
                .body(GlobalResponse.INVALID_PARAMETER.toResponseDto(Map.of("message", message)));
    }

    /**
     * 런타임 예외 클래스 처리 핸들러
     * @param e 예외 객체
     * @return 에러 응답 객체
     */
    @ExceptionHandler(RuntimeException.class)
    private ResponseEntity<ResponseDto<Map<String, Object>>> handleRuntimeException(RuntimeException e) {
        return ResponseEntity
                .status(GlobalResponse.INTERNAL_SERVER_ERROR.getHttpStatus())
                .body(GlobalResponse.INTERNAL_SERVER_ERROR.toResponseDto(Map.of("message", e.getMessage())));
    }
}