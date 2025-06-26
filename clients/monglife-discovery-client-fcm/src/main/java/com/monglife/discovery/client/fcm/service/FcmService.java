package com.monglife.discovery.client.fcm.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MulticastMessage;
import com.monglife.discovery.client.fcm.dto.FirebaseLogDto;
import com.monglife.module.common.logging.enums.LoggerType;
import com.monglife.module.common.logging.utils.LoggingUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FcmService {

    private final FirebaseMessaging mongsFirebaseMessaging;

    private final LoggingUtil loggingUtil;

    public FcmService(@Qualifier("mongsFirebaseMessaging") FirebaseMessaging mongsFirebaseMessaging, @Autowired LoggingUtil loggingUtil) {
        this.mongsFirebaseMessaging = mongsFirebaseMessaging;
        this.loggingUtil = loggingUtil;
    }

    /**
     * FCM 전송
     * @param tokens FCM Token 목록
     * @param title 제목
     * @param body 본문
     */
    public void sendPush(List<String> tokens, String title, String body) {
        try {
            if (!tokens.isEmpty()) {
                mongsFirebaseMessaging.sendEachForMulticast(MulticastMessage.builder()
                        .putData("title", title)
                        .putData("body", body)
                        .addAllTokens(tokens)
                        .build());
            }

        } catch (FirebaseMessagingException e) {
            FirebaseLogDto firebaseLogDto = FirebaseLogDto.builder()
                    .traceId(loggingUtil.getTraceId())
                    .traceOffset(loggingUtil.getTraceOffset())
                    .entryMethod(loggingUtil.getEntryMethod())
                    .className(this.getClass().getName())
                    .method(Thread.currentThread().getStackTrace()[1].getMethodName())
                    .message(e.getMessage())
                    .tokens(tokens)
                    .build();

            loggingUtil.printErrorLog(firebaseLogDto, LoggerType.CONSOLE_LOGGER);
            loggingUtil.printErrorLog(firebaseLogDto, LoggerType.LOGSTASH_LOGGER);
        }
    }
}
