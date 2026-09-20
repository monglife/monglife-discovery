package com.monglife.discovery.domain.feedback.vo;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class FeedbackVo {

    private final Long feedbackId;

    private final Long accountId;

    private final String deviceId;

    private final String deviceName;

    private final String appPackageName;

    private final String buildVersion;

    private final String title;

    private final String content;

    private final String status;

    private final String replyContent;

    private final String replySentTo;

    private final Long replyAccountId;

    private final LocalDateTime repliedAt;

    /**
     * 앱 진단 로그. 별도 표에 있고 상세 조회에서만 채운다 - 목록에서는 항상 null 이다.
     */
    private final String logs;

    private final LocalDateTime createdAt;

    private final LocalDateTime updatedAt;

    @Builder(toBuilder = true)
    public FeedbackVo(Long feedbackId, Long accountId, String deviceId, String deviceName, String appPackageName, String buildVersion, String title, String content, String status, String replyContent, String replySentTo, Long replyAccountId, LocalDateTime repliedAt, String logs, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.feedbackId = feedbackId;
        this.accountId = accountId;
        this.deviceId = deviceId;
        this.deviceName = deviceName;
        this.appPackageName = appPackageName;
        this.buildVersion = buildVersion;
        this.title = title;
        this.content = content;
        this.status = status;
        this.replyContent = replyContent;
        this.replySentTo = replySentTo;
        this.replyAccountId = replyAccountId;
        this.repliedAt = repliedAt;
        this.logs = logs;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
