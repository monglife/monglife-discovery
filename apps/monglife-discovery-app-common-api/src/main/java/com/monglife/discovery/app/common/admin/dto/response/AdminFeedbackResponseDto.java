package com.monglife.discovery.app.common.admin.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
public class AdminFeedbackResponseDto {

    private final Long reportId;

    private final Long accountId;

    private final String email;

    private final String name;

    private final String deviceId;

    private final String deviceName;

    private final String appPackageName;

    private final String buildVersion;

    private final String title;

    private final String content;

    private final String status;

    /**
     * 앱 진단 로그. 별도 표에 있어 상세에서만 채워진다 - 목록 응답에서는 항상 null 이다.
     */
    private final String logs;

    // 기본 ObjectMapper 가 날짜를 배열로 내보내므로 ISO 문자열로 고정한다
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd\'T\'HH:mm:ss")
    private final LocalDateTime createdAt;

    private final AdminFeedbackReplyResponseDto reply;

    @Builder
    public AdminFeedbackResponseDto(Long reportId, Long accountId, String email, String name, String deviceId, String deviceName, String appPackageName, String buildVersion, String title, String content, String status, String logs, LocalDateTime createdAt, AdminFeedbackReplyResponseDto reply) {
        this.reportId = reportId;
        this.accountId = accountId;
        this.email = email;
        this.name = name;
        this.deviceId = deviceId;
        this.deviceName = deviceName;
        this.appPackageName = appPackageName;
        this.buildVersion = buildVersion;
        this.title = title;
        this.content = content;
        this.status = status;
        this.logs = logs;
        this.createdAt = createdAt;
        this.reply = reply;
    }
}
