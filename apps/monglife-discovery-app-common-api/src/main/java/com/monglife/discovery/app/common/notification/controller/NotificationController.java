package com.monglife.discovery.app.common.notification.controller;

import com.monglife.core.dto.event.SendNotificationDto;
import com.monglife.core.dto.response.ResponseDto;
import com.monglife.discovery.app.common.notification.dto.request.NotificationRequestDto;
import com.monglife.discovery.app.common.notification.enums.NotificationResponse;
import com.monglife.discovery.app.common.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/notification")
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Mongs 알림 전송
     * @param notificationRequestDto 알림 전송 Dto
     * @return 성공 여부
     */
    @PostMapping("/mongs")
    public ResponseEntity<ResponseDto<?>> notification(@Valid @RequestBody NotificationRequestDto notificationRequestDto) {

        SendNotificationDto sendNotificationDto = SendNotificationDto.builder()
                .accountId(notificationRequestDto.getAccountId())
                .title(notificationRequestDto.getTitle())
                .body(notificationRequestDto.getBody())
                .build();

        notificationService.sendNotification(sendNotificationDto);

        return ResponseEntity.ok().body(NotificationResponse.DISCOVERY_APP_NOTIFICATION.toResponseDto());
    }
}