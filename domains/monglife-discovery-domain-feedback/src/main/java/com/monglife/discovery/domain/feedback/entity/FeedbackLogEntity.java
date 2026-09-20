package com.monglife.discovery.domain.feedback.entity;

import com.monglife.module.common.jpa.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 오류 신고에 딸려 온 앱 진단 로그.
 *
 * <p><b>왜 별도 표인가.</b> {@code monglife_feedback} 에 컬럼으로 붙이면 관리자 목록 조회가
 * 매 행마다 이걸 끌고 온다 - {@code FeedbackService.getFeedbacks} 는 프로젝션 없이 엔티티를
 * 통째로 읽으므로, 한 페이지(20행)에 160KB 가 딸려 오고 화면에는 한 줄도 안 쓰인다.
 * 상세에서만 따로 읽으면 그 비용이 사라진다.
 *
 * <p>보존 주기도 다르다. 신고 본문은 사용자가 쓴 기록이라 남겨야 하지만 로그는 진단이 끝나면
 * 가치가 급격히 떨어진다. 표가 갈려 있어야 로그만 따로 지울 수 있다.
 *
 * <p>연관관계(@OneToOne)를 걸지 않고 {@code feedbackId} 로만 조회한다. 지연 로딩을 걸어도
 * 목록 경로에서 한 번 건드리는 순간 N+1 이 되는데, 그 사고를 애초에 못 내게 막는 쪽을 골랐다.
 *
 * <p>stg/prd 는 hbm2ddl 이 none 이라 수동 DDL 이 필요하다 (configs/migration 참고).
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        name = "monglife_feedback_log",
        indexes = {
                @Index(name = "idx_monglife_feedback_log_feedback_id", columnList = "feedbackId", unique = true)
        }
)
public class FeedbackLogEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long feedbackLogId;

    @Column(nullable = false, updatable = false, unique = true)
    private Long feedbackId;

    /**
     * 앱이 보낸 logcat 조각. 앱에서 이미 마지막 300줄·8KB 로 자르고 토큰을 가려서 보낸다.
     * TEXT 는 64KB 라 상한이 늘어도 여유가 있다.
     */
    @Column(nullable = false, updatable = false, columnDefinition = "TEXT")
    private String logs;

    @Builder
    public FeedbackLogEntity(Long feedbackId, String logs) {
        this.feedbackId = feedbackId;
        this.logs = logs;
    }
}
