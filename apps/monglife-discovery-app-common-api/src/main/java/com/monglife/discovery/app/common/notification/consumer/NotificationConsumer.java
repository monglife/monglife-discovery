package com.monglife.discovery.app.common.notification.consumer;

import com.monglife.core.dto.event.SendNotificationDto;
import com.monglife.discovery.app.common.notification.service.NotificationService;
import com.monglife.module.common.kafka.event.TransactionEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestBody;

@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationService notificationService;

    /**
     * Mongs 알림 전송 트랜잭션 컨슈머
     * @param event 알림 전송 이벤트
     */
    @KafkaListener(topics = "notification.mongs")
    public void sendMongsNotification(@RequestBody TransactionEvent<SendNotificationDto> event) {

        SendNotificationDto sendNotificationDto = event.getData();

        notificationService.sendNotification(sendNotificationDto);
    }
}
