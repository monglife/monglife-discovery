package com.monglife.discovery.app.common.feedback.service;

import com.monglife.discovery.domain.account.service.TokenService;
import com.monglife.discovery.domain.account.vo.TokenVo;
import com.monglife.discovery.domain.feedback.service.FeedbackService;
import com.monglife.discovery.domain.feedback.vo.FeedbackVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AppFeedbackService {

    private final FeedbackService feedbackService;
    private final TokenService tokenService;

    /**
     * 앱 오류 신고 등록. 패키지명·빌드 버전은 액세스 토큰(세션)에서 가져온다.
     */
    @Transactional
    public FeedbackVo createFeedback(Long accountId, String deviceId, String accessToken, String deviceName, String title, String content, String logs) {
        TokenVo token = tokenService.getToken(accessToken);
        return feedbackService.createFeedback(FeedbackVo.builder()
                .accountId(accountId)
                .deviceId(deviceId != null ? deviceId : token.getDeviceId())
                .deviceName(deviceName)
                .appPackageName(token.getAppPackageName())
                .buildVersion(token.getBuildVersion())
                .title(title)
                .content(content)
                .logs(logs)
                .build());
    }
}
