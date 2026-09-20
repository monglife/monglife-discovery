package com.monglife.discovery.domain.device.entity;

import com.monglife.module.common.jpa.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 서버 점검 일정.
 *
 * <p>행 하나가 점검 일정 하나다. 전역이라 앱 패키지로 가르지 않는다 — 서버를 내리면 전부 내려간다.
 *
 * <p>"지금 점검 중" 은 컬럼이 아니라 <b>계산</b>이다.
 * {@code enabled} 이고 {@code startAt} 이 지났고 {@code endAt} 이 아직이면 점검 중이다.
 * 플래그를 따로 두면 예약해 둔 시각이 와도 사람이 켜 주어야 해서 예약의 의미가 없어진다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "monglife_maintenance")
public class MaintenanceEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long maintenanceId;

    /** 앱이 점검 화면에 그대로 띄우는 안내 문구 */
    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private LocalDateTime startAt;

    /** null 이면 종료 미정. 손으로 끄기 전까지 계속 점검 중이다 */
    private LocalDateTime endAt;

    @Column(nullable = false)
    private Boolean enabled;


    @Builder
    public MaintenanceEntity(String message, LocalDateTime startAt, LocalDateTime endAt, Boolean enabled) {
        this.message = message;
        this.startAt = startAt;
        this.endAt = endAt;
        this.enabled = enabled;
    }

    public void update(String message, LocalDateTime startAt, LocalDateTime endAt, Boolean enabled) {
        this.message = message;
        this.startAt = startAt;
        this.endAt = endAt;
        this.enabled = enabled;
    }

    public void updateEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    /**
     * 주어진 시각에 점검 중인가.
     *
     * <p>끝은 열린 구간이다 — {@code endAt} 정각이면 점검이 끝난 것으로 본다.
     * 조회 쿼리({@code MaintenanceRepository.findActive})의 조건과 같은 판정이어야 한다.
     */
    public boolean isActive(LocalDateTime at) {
        return Boolean.TRUE.equals(this.enabled)
                && !this.startAt.isAfter(at)
                && (this.endAt == null || this.endAt.isAfter(at));
    }
}
