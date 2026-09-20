package com.monglife.discovery.app.common.admin.service;

import com.monglife.discovery.app.common.admin.dto.response.*;
import com.monglife.discovery.domain.account.vo.AccountVo;
import com.monglife.discovery.domain.account.vo.LoginHistoryVo;
import com.monglife.discovery.domain.account.vo.TokenVo;
import com.monglife.discovery.domain.device.vo.AppVersionVo;
import com.monglife.discovery.domain.device.vo.DeviceVo;
import com.monglife.discovery.domain.feedback.vo.FeedbackVo;

import java.util.Map;

/** 도메인 Vo → 관리자 응답 DTO. 필드명은 관리자 웹 타입과 1:1 */
final class AdminMapper {

    private AdminMapper() {}

    /** DB 는 대문자(GOOGLE), 화면은 소문자(google) */
    static String platform(String platform) {
        return platform == null ? null : platform.toLowerCase();
    }

    static AdminAccountResponseDto account(AccountVo a) {
        return AdminAccountResponseDto.builder()
                .accountId(a.getAccountId())
                .socialAccountId(a.getSocialAccountId())
                .platform(platform(a.getPlatform()))
                .email(a.getEmail())
                .name(a.getName())
                .role(a.getRole())
                .isDeleted(a.getIsDeleted())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }

    static AdminDeviceResponseDto device(DeviceVo d, Map<Long, AccountVo> accounts) {
        AccountVo a = d.getAccountId() == null ? null : accounts.get(d.getAccountId());
        return AdminDeviceResponseDto.builder()
                .deviceId(d.getDeviceId())
                .deviceName(d.getDeviceName())
                .fcmToken(d.getFcmToken())
                .accountId(d.getAccountId())
                .accountEmail(a == null ? null : a.getEmail())
                .accountName(a == null ? null : a.getName())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }

    static AdminLoginHistoryResponseDto loginHistory(LoginHistoryVo h) {
        return AdminLoginHistoryResponseDto.builder()
                .accountLogId(h.getAccountLogId())
                .accountId(h.getAccountId())
                .deviceId(h.getDeviceId())
                .appPackageName(h.getAppPackageName())
                .deviceName(h.getDeviceName())
                .buildVersion(h.getBuildVersion())
                .loginAt(h.getLoginAt())
                .loginCount(h.getLoginCount())
                .build();
    }

    static AdminSessionResponseDto session(TokenVo t, Map<Long, AccountVo> accounts, Map<String, DeviceVo> devices) {
        AccountVo a = accounts.get(t.getAccountId());
        DeviceVo d = devices.get(t.getDeviceId());
        return AdminSessionResponseDto.builder()
                .refreshToken(t.getRefreshToken())
                .accessToken(t.getAccessToken())
                .deviceId(t.getDeviceId())
                .accountId(t.getAccountId())
                .appPackageName(t.getAppPackageName())
                .buildVersion(t.getBuildVersion())
                .createdAt(t.getCreatedAt())
                .expiration(t.getExpiration())
                .email(a == null ? null : a.getEmail())
                .name(a == null ? null : a.getName())
                .deviceName(d == null ? null : d.getDeviceName())
                .build();
    }

    static AdminAppVersionResponseDto appVersion(AppVersionVo v) {
        return AdminAppVersionResponseDto.builder()
                .appVersionId(v.getAppVersionId())
                .appPackageName(v.getAppPackageName())
                .buildVersion(v.getBuildVersion())
                .mustUpdate(v.getMustUpdate())
                .createdAt(v.getCreatedAt())
                .updatedAt(v.getUpdatedAt())
                .build();
    }

    static AdminFeedbackResponseDto feedback(FeedbackVo f, Map<Long, AccountVo> accounts, boolean withContent) {
        AccountVo a = accounts.get(f.getAccountId());
        AdminFeedbackReplyResponseDto reply = f.getReplyContent() == null ? null : AdminFeedbackReplyResponseDto.builder()
                .content(f.getReplyContent())
                .sentTo(f.getReplySentTo())
                .createdAt(f.getRepliedAt())
                .build();
        return AdminFeedbackResponseDto.builder()
                .reportId(f.getFeedbackId())
                .accountId(f.getAccountId())
                .email(a == null ? null : a.getEmail())
                .name(a == null ? null : a.getName())
                .deviceId(f.getDeviceId())
                .deviceName(f.getDeviceName())
                .appPackageName(f.getAppPackageName())
                .buildVersion(f.getBuildVersion())
                .title(f.getTitle())
                .content(withContent ? f.getContent() : null)
                // 목록에서는 애초에 조회조차 하지 않는다. 이 삼항은 그 전제가 깨졌을 때의 안전망이다.
                .logs(withContent ? f.getLogs() : null)
                .status(f.getStatus())
                .createdAt(f.getCreatedAt())
                .reply(reply)
                .build();
    }
}
