package com.monglife.discovery.client.fcm.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MulticastMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FcmService {

    private final FirebaseMessaging firebaseMessaging;

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
                firebaseMessaging.sendEachForMulticast(MulticastMessage.builder()
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
