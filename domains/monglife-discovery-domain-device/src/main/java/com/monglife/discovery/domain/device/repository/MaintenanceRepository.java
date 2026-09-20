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
     */
    @Query("select m from MaintenanceEntity m " +
            "where m.enabled = true and m.startAt <= :now and (m.endAt is null or m.endAt > :now) " +
            "order by m.startAt asc")
    List<MaintenanceEntity> findActive(@Param("now") LocalDateTime now);
}
