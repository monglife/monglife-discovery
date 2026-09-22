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
 * <p>공개 경로({@code /public/auth/verify/version})는 {@link #getActiveMaintenance(String)} 하나만 쓴다.
 * 나머지는 관리자 화면용이다.
 */
@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;

    static MaintenanceVo toVo(MaintenanceEntity e, LocalDateTime now) {
        return MaintenanceVo.builder()
                .maintenanceId(e.getMaintenanceId())
                .appPackageName(e.getAppPackageName())
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
     *
     * @param appPackageName 진입을 시도하는 앱. 이 앱을 대상으로 하거나 전역인 일정만 본다
     * @return 점검 중이 아니면 빈 Optional
     */
    @Transactional(readOnly = true)
    public Optional<MaintenanceVo> getActiveMaintenance(String appPackageName) {

        LocalDateTime now = LocalDateTime.now();

        return maintenanceRepository.findActive(now, appPackageName).stream().findFirst().map(e -> toVo(e, now));
    }

    // ----- 관리자 -----

    /**
     * 앱을 가리지 않고, 지금 진행 중인 모든 점검 일정.
     *
     * <p>관리자는 "지금 뭐가 걸려 있나" 를 봐야 한다. 진입 게이트와 달리 특정 앱 관점이 아니므로
     * 웨어만 내린 점검도 그대로 보인다.
     */
    @Transactional(readOnly = true)
    public List<MaintenanceVo> getActiveMaintenances() {
        LocalDateTime now = LocalDateTime.now();
        return maintenanceRepository.findActiveAll(now).stream().map(e -> toVo(e, now)).toList();
    }

    @Transactional(readOnly = true)
    public List<MaintenanceVo> getMaintenances() {
        LocalDateTime now = LocalDateTime.now();
        return maintenanceRepository.findAllByOrderByStartAtDesc().stream().map(e -> toVo(e, now)).toList();
    }

    @Transactional
    public MaintenanceVo createMaintenance(String appPackageName, String message, LocalDateTime startAt, LocalDateTime endAt, Boolean enabled) {

        validatePeriod(startAt, endAt);

        return toVo(maintenanceRepository.save(MaintenanceEntity.builder()
                .appPackageName(appPackageName)
                .message(message)
                .startAt(startAt)
                .endAt(endAt)
                .enabled(enabled)
                .build()), LocalDateTime.now());
    }

    @Transactional
    public MaintenanceVo updateMaintenance(Long maintenanceId, String appPackageName, String message, LocalDateTime startAt, LocalDateTime endAt, Boolean enabled) {

        validatePeriod(startAt, endAt);

        MaintenanceEntity e = find(maintenanceId);
        e.update(appPackageName, message, startAt, endAt, enabled);

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
