package com.monglife.discovery.app.common.feedback.controller;

import com.monglife.core.dto.response.ResponseDto;
import com.monglife.discovery.app.common.feedback.dto.request.CreateFeedbackRequestDto;
import com.monglife.discovery.app.common.feedback.enums.FeedbackResponse;
import com.monglife.discovery.app.common.feedback.service.AppFeedbackService;
import com.monglife.module.common.logging.annotation.EntryLoggingPoint;
import com.monglife.module.common.security.principal.Passport;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 앱 오류 신고. monglife-mongs 의 POST /api/user/feedback 을 Discovery 로 옮긴 것.
 * 인증은 기존 /** 규칙(NORMAL/ADMIN). 계정·기기는 패스포트, 앱 패키지·버전은 액세스 토큰에서 온다.
 */
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/feedback")
public class FeedbackController {

    private static final String BEARER_PREFIX = "Bearer ";

    private final AppFeedbackService appFeedbackService;

    @EntryLoggingPoint
    @PostMapping
    public ResponseEntity<ResponseDto<?>> createFeedback(
            @AuthenticationPrincipal Passport passport,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            @Valid @RequestBody CreateFeedbackRequestDto dto
    ) {
        String accessToken = authorization.startsWith(BEARER_PREFIX) ? authorization.substring(BEARER_PREFIX.length()) : authorization;

        appFeedbackService.createFeedback(
                passport.getAccountId(), passport.getDeviceId(), accessToken,
                dto.getDeviceName(), dto.getTitle(), dto.getContent(), dto.getLogs()
        );

        return ResponseEntity.ok().body(FeedbackResponse.DISCOVERY_APP_FEEDBACK_CREATE.toResponseDto());
    }
}
