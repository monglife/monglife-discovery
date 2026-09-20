package com.monglife.discovery.domain.device.service;

import com.monglife.discovery.domain.device.entity.MaintenanceEntity;
import com.monglife.discovery.domain.device.exception.InvalidMaintenancePeriodException;
import com.monglife.discovery.domain.device.exception.NotExistsMaintenanceException;
import com.monglife.discovery.domain.device.repository.MaintenanceRepository;
import com.monglife.discovery.domain.device.vo.MaintenanceVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 서버 점검 일정.
 *
 * <p>공개 경로({@code /public/auth/verify/version})는 {@link #getActiveMaintenance()} 하나만 쓴다.
 * 나머지는 관리자 화면용이다.
 */
@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;

    static MaintenanceVo toVo(MaintenanceEntity e, LocalDateTime now) {
        return MaintenanceVo.builder()
                .maintenanceId(e.getMaintenanceId())
                .message(e.getMessage())
                .startAt(e.getStartAt())
                .endAt(e.getEndAt())
                .enabled(e.getEnabled())
                .active(e.isActive(now))
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    /**
     * 지금 진행 중인 점검 일정.
     *
     * <p>겹치게 등록된 일정이 있으면 먼저 시작한 것을 쓴다.
     * @return 점검 중이 아니면 빈 Optional
     */
    @Transactional(readOnly = true)
    public Optional<MaintenanceVo> getActiveMaintenance() {

        LocalDateTime now = LocalDateTime.now();

        return maintenanceRepository.findActive(now).stream().findFirst().map(e -> toVo(e, now));
    }

    // ----- 관리자 -----

    @Transactional(readOnly = true)
    public List<MaintenanceVo> getMaintenances() {
        LocalDateTime now = LocalDateTime.now();
        return maintenanceRepository.findAllByOrderByStartAtDesc().stream().map(e -> toVo(e, now)).toList();
    }

    @Transactional
    public MaintenanceVo createMaintenance(String message, LocalDateTime startAt, LocalDateTime endAt, Boolean enabled) {

        validatePeriod(startAt, endAt);

        return toVo(maintenanceRepository.save(MaintenanceEntity.builder()
                .message(message)
                .startAt(startAt)
                .endAt(endAt)
                .enabled(enabled)
                .build()), LocalDateTime.now());
    }

    @Transactional
    public MaintenanceVo updateMaintenance(Long maintenanceId, String message, LocalDateTime startAt, LocalDateTime endAt, Boolean enabled) {

        validatePeriod(startAt, endAt);

        MaintenanceEntity e = find(maintenanceId);
        e.update(message, startAt, endAt, enabled);

        return toVo(e, LocalDateTime.now());
    }

    @Transactional
    public MaintenanceVo updateEnabled(Long maintenanceId, Boolean enabled) {

        MaintenanceEntity e = find(maintenanceId);
        e.updateEnabled(enabled);

        return toVo(e, LocalDateTime.now());
    }

    @Transactional
    public void deleteMaintenance(Long maintenanceId) {
        maintenanceRepository.delete(find(maintenanceId));
    }

    private MaintenanceEntity find(Long maintenanceId) {
        return maintenanceRepository.findById(maintenanceId)
                .orElseThrow(() -> new NotExistsMaintenanceException(maintenanceId));
    }

    /** endAt 이 null 이면 종료 미정이라 통과다 */
    private void validatePeriod(LocalDateTime startAt, LocalDateTime endAt) {
        if (endAt != null && !endAt.isAfter(startAt)) {
            throw new InvalidMaintenancePeriodException(startAt, endAt);
        }
    }
}
