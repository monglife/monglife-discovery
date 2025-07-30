package com.monglife.discovery.app.common.notification.service;

import com.monglife.core.dto.event.SendNotificationDto;
import com.monglife.discovery.client.fcm.service.FcmService;
import com.monglife.discovery.domain.device.service.DeviceService;
import com.monglife.discovery.domain.device.vo.DeviceVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final FcmService fcmService;

    private final DeviceService deviceService;

    /**
     * 알림 전송
     * @param sendNotificationDto 알림 정보 Dto
     */
    @Transactional
    public void sendNotification(SendNotificationDto sendNotificationDto) {

        List<DeviceVo> deviceVos = deviceService.getDevices(sendNotificationDto.getAccountId());

        List<String> tokens = deviceVos.stream()
                        .map(DeviceVo::getFcmToken)
                        .toList();

        String title = sendNotificationDto.getTitle();
        String body = sendNotificationDto.getBody();

        fcmService.sendPush(tokens, title, body);
    }
}
