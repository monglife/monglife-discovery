package com.monglife.discovery.client.fcm.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MulticastMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class FcmService {

    private final FirebaseMessaging mongsFirebaseMessaging;

    public FcmService(@Qualifier("mongsFirebaseMessaging") FirebaseMessaging mongsFirebaseMessaging) {
        this.mongsFirebaseMessaging = mongsFirebaseMessaging;
    }

    /**
     * FCM 전송
     * @param tokens FCM Token 목록
     * @param title 제목
     * @param body 본문
     * @param isAppForegroundMessage 백그라운드 메시지 여부
     */
    public void sendPush(List<String> tokens, String title, String body, Boolean isAppForegroundMessage) {
        try {
            if (!tokens.isEmpty()) {
                mongsFirebaseMessaging.sendEachForMulticast(MulticastMessage.builder()
                        .putData("title", title)
                        .putData("body", body)
                        .putData("isAppForegroundMessage", isAppForegroundMessage.toString())
                        .addAllTokens(tokens)
                        .build());
            }

        } catch (FirebaseMessagingException e) {
            log.error("[FCM] {}", e.getMessage());
        }
    }
}
