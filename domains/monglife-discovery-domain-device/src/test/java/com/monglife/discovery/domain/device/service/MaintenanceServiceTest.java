package com.monglife.discovery.domain.device.service;

import com.monglife.discovery.domain.device.entity.MaintenanceEntity;
import com.monglife.discovery.domain.device.exception.InvalidMaintenancePeriodException;
import com.monglife.discovery.domain.device.exception.NotExistsMaintenanceException;
import com.monglife.discovery.domain.device.repository.MaintenanceRepository;
import com.monglife.discovery.domain.device.vo.MaintenanceVo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
@DisplayName("MaintenanceService")
class MaintenanceServiceTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 9, 21, 3, 0);
    private static final String WEAR = "com.mongs.wear";
    private static final String IOS = "com.mongs.ios";

    @Mock private MaintenanceRepository maintenanceRepository;

    @InjectMocks private MaintenanceService maintenanceService;

    private MaintenanceEntity entity(LocalDateTime startAt, LocalDateTime endAt, boolean enabled) {
        return entity(null, startAt, endAt, enabled);
    }

    private MaintenanceEntity entity(String appPackageName, LocalDateTime startAt, LocalDateTime endAt, boolean enabled) {
        return MaintenanceEntity.builder()
                .appPackageName(appPackageName)
                .message("서버 점검 중입니다.")
                .startAt(startAt)
                .endAt(endAt)
                .enabled(enabled)
                .build();
    }

    // ----- isActive 경계. findActive 의 JPQL 조건과 같은 판정이어야 한다 -----

    @Test
    @DisplayName("시작 정각은 점검 중, 종료 정각은 점검이 끝난 것")
    void isActive_boundary() {
        MaintenanceEntity e = entity(NOW, NOW.plusHours(2), true);

        assertThat(e.isActive(NOW.minusNanos(1))).isFalse();
        assertThat(e.isActive(NOW)).isTrue();
        assertThat(e.isActive(NOW.plusHours(2).minusNanos(1))).isTrue();
        assertThat(e.isActive(NOW.plusHours(2))).isFalse();
    }

    @Test
    @DisplayName("종료 미정이면 시작 이후로 계속 점검 중")
    void isActive_openEnded() {
        assertThat(entity(NOW, null, true).isActive(NOW.plusYears(1))).isTrue();
    }

    @Test
    @DisplayName("enabled 가 꺼져 있으면 시간과 무관하게 점검이 아니다")
    void isActive_disabled() {
        assertThat(entity(NOW.minusHours(1), NOW.plusHours(1), false).isActive(NOW)).isFalse();
    }

    // ----- getActiveMaintenance -----

    @Test
    @DisplayName("진행 중인 일정이 없으면 빈 Optional")
    void getActiveMaintenance_none() {
        given(maintenanceRepository.findActive(any(), any())).willReturn(List.of());

        assertThat(maintenanceService.getActiveMaintenance(WEAR)).isEmpty();
    }

    @Test
    @DisplayName("겹치는 일정이 여럿이면 첫 건을 쓴다 (단건 조회로 받으면 예외가 났을 자리)")
    void getActiveMaintenance_overlapping() {
        // active 는 서비스가 실제 시계로 계산하므로, 여기 일정은 지금을 감싸야 한다
        LocalDateTime now = LocalDateTime.now();
        given(maintenanceRepository.findActive(any(), any())).willReturn(List.of(
                entity(now.minusHours(2), now.plusHours(1), true),
                entity(now.minusHours(1), now.plusHours(3), true)));

        Optional<MaintenanceVo> vo = maintenanceService.getActiveMaintenance(WEAR);

        assertThat(vo).isPresent();
        assertThat(vo.get().getStartAt()).isEqualTo(now.minusHours(2));
        assertThat(vo.get().getActive()).isTrue();
    }

    // ----- 앱 패키지 분리 -----

    @Test
    @DisplayName("조회할 때 대상 앱을 그대로 넘긴다 - 필터가 쿼리에서 걸린다")
    void getActiveMaintenance_passesAppPackageName() {
        given(maintenanceRepository.findActive(any(), any())).willReturn(List.of());

        maintenanceService.getActiveMaintenance(IOS);

        then(maintenanceRepository).should().findActive(any(), eq(IOS));
    }

    @Test
    @DisplayName("전역 일정(null)은 모든 앱을 막는다")
    void covers_global() {
        assertThat(entity(null, NOW, null, true).covers(WEAR)).isTrue();
        assertThat(entity(null, NOW, null, true).covers(IOS)).isTrue();
    }

    @Test
    @DisplayName("앱을 지정한 일정은 그 앱만 막는다 - 웨어 점검이 iOS 를 막지 않는다")
    void covers_specific() {
        MaintenanceEntity wearOnly = entity(WEAR, NOW, null, true);

        assertThat(wearOnly.covers(WEAR)).isTrue();
        assertThat(wearOnly.covers(IOS)).isFalse();
    }

    @Test
    @DisplayName("빈 문자열은 전역으로 저장된다 - 화면의 '전체' 가 빈 값으로 오기 때문")
    void blankAppPackageNameIsGlobal() {
        assertThat(entity("", NOW, null, true).getAppPackageName()).isNull();
        assertThat(entity("   ", NOW, null, true).covers(IOS)).isTrue();
    }

    // ----- 관리자 조회는 앱을 가리지 않는다 -----

    @Test
    @DisplayName("관리자 조회는 findActiveAll 을 쓴다 - findActive(null) 로 대신하면 앱별 점검이 배너에서 사라진다")
    void getActiveMaintenances_usesUnfilteredQuery() {
        LocalDateTime now = LocalDateTime.now();
        given(maintenanceRepository.findActiveAll(any())).willReturn(List.of(
                entity(WEAR, now.minusHours(1), now.plusHours(1), true),
                entity(IOS, now.minusHours(2), null, true)));

        List<MaintenanceVo> vos = maintenanceService.getActiveMaintenances();

        assertThat(vos).extracting(MaintenanceVo::getAppPackageName).containsExactly(WEAR, IOS);
        then(maintenanceRepository).should(never()).findActive(any(), any());
    }

    @Test
    @DisplayName("진행 중인 일정이 없으면 빈 목록")
    void getActiveMaintenances_none() {
        given(maintenanceRepository.findActiveAll(any())).willReturn(List.of());

        assertThat(maintenanceService.getActiveMaintenances()).isEmpty();
    }

    // ----- 기간 검증 -----

    @Test
    @DisplayName("종료가 시작보다 앞서면 등록 거부")
    void createMaintenance_reversedPeriod() {
        assertThatThrownBy(() -> maintenanceService.createMaintenance(null, "점검", NOW, NOW.minusHours(1), true))
                .isInstanceOf(InvalidMaintenancePeriodException.class);
    }

    @Test
    @DisplayName("종료와 시작이 같아도 거부 (길이 0 인 점검은 의미가 없다)")
    void createMaintenance_zeroLengthPeriod() {
        assertThatThrownBy(() -> maintenanceService.createMaintenance(null, "점검", NOW, NOW, true))
                .isInstanceOf(InvalidMaintenancePeriodException.class);
    }

    @Test
    @DisplayName("종료 미정은 통과")
    void createMaintenance_openEnded() {
        given(maintenanceRepository.save(any())).willAnswer(i -> i.getArgument(0));

        assertThat(maintenanceService.createMaintenance(null, "점검", NOW, null, true).getEndAt()).isNull();
    }

    @Test
    @DisplayName("앱을 지정해 등록하면 그대로 저장된다")
    void createMaintenance_withAppPackageName() {
        given(maintenanceRepository.save(any())).willAnswer(i -> i.getArgument(0));

        assertThat(maintenanceService.createMaintenance(WEAR, "점검", NOW, null, true).getAppPackageName())
                .isEqualTo(WEAR);
    }

    // ----- 없는 id -----

    @Test
    @DisplayName("없는 id 로 수정하면 NotExistsMaintenanceException")
    void updateEnabled_notExists() {
        given(maintenanceRepository.findById(404L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> maintenanceService.updateEnabled(404L, true))
                .isInstanceOf(NotExistsMaintenanceException.class);
    }

    @Test
    @DisplayName("없는 id 로 삭제하면 NotExistsMaintenanceException")
    void deleteMaintenance_notExists() {
        given(maintenanceRepository.findById(404L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> maintenanceService.deleteMaintenance(404L))
                .isInstanceOf(NotExistsMaintenanceException.class);
    }
}
