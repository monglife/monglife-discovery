package com.monglife.discovery.app.common.admin.enums;

import com.monglife.core.enums.response.Response;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum AdminResponse implements Response {

    DISCOVERY_APP_ADMIN_ACCOUNT_LIST(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-000", "계정 목록 조회에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_ACCOUNT_GET(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-001", "계정 조회에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_ACCOUNT_UPDATE(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-002", "계정 수정에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_ACCOUNT_SUMMARIES(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-003", "계정 요약 조회에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_DEVICE_LIST(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-010", "기기 목록 조회에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_DEVICE_CONNECT(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-011", "기기 연결에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_DEVICE_DISCONNECT(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-012", "기기 연결 해제에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_DEVICE_DELETE(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-013", "기기 삭제에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_SESSION_LIST(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-020", "로그인 현황 조회에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_SESSION_DELETE(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-021", "로그아웃 처리에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_APP_VERSION_LIST(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-030", "앱 버전 목록 조회에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_APP_VERSION_CREATE(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-031", "앱 버전 등록에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_APP_VERSION_UPDATE(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-032", "앱 버전 수정에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_APP_VERSION_DELETE(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-033", "앱 버전 삭제에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_NOTIFICATION_DEVICE_LIST(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-040", "알림 가능 기기 조회에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_FEEDBACK_LIST(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-050", "오류 신고 목록 조회에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_FEEDBACK_GET(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-051", "오류 신고 조회에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_FEEDBACK_REPLY(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-052", "오류 신고 답변을 발송하였습니다."),
    DISCOVERY_APP_ADMIN_META_FILTERS(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-060", "필터 옵션 조회에 성공하였습니다."),
    DISCOVERY_APP_ADMIN_STATS(HttpStatus.OK.value(), "DISCOVERY-APP-ADMIN-070", "통계 조회에 성공하였습니다."),
    ;

    private final Integer httpStatus;

    private final String code;

    private final String message;
}
