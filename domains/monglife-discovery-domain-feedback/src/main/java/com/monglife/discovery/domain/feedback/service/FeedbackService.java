package com.monglife.discovery.domain.feedback.service;

import com.monglife.discovery.domain.feedback.entity.FeedbackEntity;
import com.monglife.discovery.domain.feedback.entity.FeedbackLogEntity;
import com.monglife.discovery.domain.feedback.exception.NotExistsFeedbackException;
import com.monglife.discovery.domain.feedback.repository.FeedbackLogRepository;
import com.monglife.discovery.domain.feedback.repository.FeedbackRepository;
import com.monglife.discovery.domain.feedback.vo.FeedbackSearchVo;
import com.monglife.discovery.domain.feedback.vo.FeedbackVo;
import com.monglife.discovery.domain.feedback.vo.PageVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackLogRepository feedbackLogRepository;

    static FeedbackVo toVo(FeedbackEntity e) {
        return FeedbackVo.builder()
                .feedbackId(e.getFeedbackId())
                .accountId(e.getAccountId())
                .deviceId(e.getDeviceId())
                .deviceName(e.getDeviceName())
                .appPackageName(e.getAppPackageName())
                .buildVersion(e.getBuildVersion())
                .title(e.getTitle())
                .content(e.getContent())
                .status(e.getStatus())
                .replyContent(e.getReplyContent())
                .replySentTo(e.getReplySentTo())
                .replyAccountId(e.getReplyAccountId())
                .repliedAt(e.getRepliedAt())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    /**
     * 오류 신고 등록 (앱)
     */
    @Transactional
    public FeedbackVo createFeedback(FeedbackVo vo) {
        FeedbackVo saved = toVo(feedbackRepository.save(FeedbackEntity.builder()
                .accountId(vo.getAccountId())
                .deviceId(vo.getDeviceId())
                .deviceName(vo.getDeviceName())
                .appPackageName(vo.getAppPackageName())
                .buildVersion(vo.getBuildVersion())
                .title(vo.getTitle())
                .content(vo.getContent())
                .build()));

        // 로그는 부수적이다. 없으면 없는 대로 둔다 - 신고 본문이 더 중요하다.
        if (vo.getLogs() != null && !vo.getLogs().isBlank()) {
            feedbackLogRepository.save(FeedbackLogEntity.builder()
                    .feedbackId(saved.getFeedbackId())
                    .logs(vo.getLogs())
                    .build());
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public FeedbackVo getFeedback(Long feedbackId) {
        FeedbackVo vo = toVo(feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotExistsFeedbackException(feedbackId)));

        // 상세에서만 로그를 붙인다. 목록(getFeedbacks)은 건드리지 않는다 - 표를 가른 이유다.
        return feedbackLogRepository.findByFeedbackId(feedbackId)
                .map(log -> vo.toBuilder().logs(log.getLogs()).build())
                .orElse(vo);
    }

    @Transactional(readOnly = true)
    public PageVo<FeedbackVo> getFeedbacks(FeedbackSearchVo cond) {
        return PageVo.<FeedbackVo>builder()
                .items(feedbackRepository.findPage(cond).stream().map(FeedbackService::toVo).toList())
                .page(cond.getPage())
                .size(cond.getSize())
                .total(feedbackRepository.countPage(cond))
                .build();
    }

    /**
     * 관리자 답변. 이미 답변된 건은 덮어쓴다.
     */
    @Transactional
    public FeedbackVo reply(Long feedbackId, String content, String sentTo, Long adminAccountId) {
        FeedbackEntity e = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotExistsFeedbackException(feedbackId));
        e.reply(content, sentTo, adminAccountId);
        return toVo(e);
    }
}
