package com.monglife.discovery.domain.device.repository;

import com.monglife.discovery.domain.device.entity.MaintenanceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MaintenanceRepository extends JpaRepository<MaintenanceEntity, Long> {

    List<MaintenanceEntity> findAllByOrderByStartAtDesc();

    /**
     * 주어진 시각에 진행 중인 점검 일정.
     *
     * <p>파생 쿼리로 쓰면 {@code endAt is null} OR 조건이 메서드 이름에 들어가지 않아 JPQL 로 둔다.
     *
     * <p><b>단건이 아니라 목록으로 받는다.</b> 일정이 겹치게 등록되는 것을 막지 않기 때문에
     * 단건으로 받으면 그때 {@code NonUniqueResultException} 이 난다. 겹치면 먼저 시작한 것을 쓴다.
     *
     * <p>대상 앱이 {@code appPackageName} 이거나 전역(null)인 것만 고른다. 전역을 놓치면
     * 서버 전체를 내리는 점검이 아무 앱도 막지 못한다.
     */
    @Query("select m from MaintenanceEntity m " +
            "where m.enabled = true and m.startAt <= :now and (m.endAt is null or m.endAt > :now) " +
            "and (m.appPackageName is null or m.appPackageName = :appPackageName) " +
            "order by m.startAt asc")
    List<MaintenanceEntity> findActive(@Param("now") LocalDateTime now,
                                       @Param("appPackageName") String appPackageName);

    /**
     * 앱을 가리지 않고, 지금 진행 중인 모든 점검 일정.
     *
     * <p>관리자 화면 전용이다. {@link #findActive} 에 null 을 넘겨 대신 쓰면 안 된다 - 그쪽은
     * null 이 "전역 일정만" 이라 웨어만 내린 점검이 배너에서 통째로 사라진다.
     */
    @Query("select m from MaintenanceEntity m " +
            "where m.enabled = true and m.startAt <= :now and (m.endAt is null or m.endAt > :now) " +
            "order by m.startAt asc")
    List<MaintenanceEntity> findActiveAll(@Param("now") LocalDateTime now);
}
