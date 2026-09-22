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
 * <p>행 하나가 점검 일정 하나다. {@code appPackageName} 으로 대상 앱을 가른다 —
 * 비워 두면 전역이고, 채우면 그 앱만 막힌다. 전부를 내리는 작업과 한 앱만 내리는 작업이
 * 둘 다 있어서다. 웨어를 점검한다고 iOS 까지 막을 이유가 없다.
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

    /**
     * 점검 대상 앱. null 이면 전역이라 모든 앱이 막힌다.
     *
     * <p>nullable 인 것이 핵심이다. 이 컬럼이 생기기 전에 등록된 일정은 전부 전역이었고,
     * null 로 남아 그 뜻이 그대로 유지된다.
     */
    private String appPackageName;

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
    public MaintenanceEntity(String appPackageName, String message, LocalDateTime startAt, LocalDateTime endAt, Boolean enabled) {
        this.appPackageName = blankToNull(appPackageName);
        this.message = message;
        this.startAt = startAt;
        this.endAt = endAt;
        this.enabled = enabled;
    }

    public void update(String appPackageName, String message, LocalDateTime startAt, LocalDateTime endAt, Boolean enabled) {
        this.appPackageName = blankToNull(appPackageName);
        this.message = message;
        this.startAt = startAt;
        this.endAt = endAt;
        this.enabled = enabled;
    }

    public void updateEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    /**
     * 화면에서 "전체" 를 고르면 빈 문자열이 올 수 있다. 전역은 null 하나로만 표현해야
     * 조회 조건({@code appPackageName is null})이 갈라지지 않는다.
     */
    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
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

    /**
     * 이 일정이 주어진 앱을 막는가. 전역(null)이면 모든 앱을 막는다.
     *
     * <p>관리자 목록의 {@code active} 는 대상 앱과 무관한 "지금 켜져 있는가" 라서
     * {@link #isActive(LocalDateTime)} 와 나눠 둔다.
     */
    public boolean covers(String targetAppPackageName) {
        return this.appPackageName == null || this.appPackageName.equals(targetAppPackageName);
    }
}
