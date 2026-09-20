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
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("MaintenanceService")
class MaintenanceServiceTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 9, 21, 3, 0);

    @Mock private MaintenanceRepository maintenanceRepository;

    @InjectMocks private MaintenanceService maintenanceService;

    private MaintenanceEntity entity(LocalDateTime startAt, LocalDateTime endAt, boolean enabled) {
        return MaintenanceEntity.builder()
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
        given(maintenanceRepository.findActive(any())).willReturn(List.of());

        assertThat(maintenanceService.getActiveMaintenance()).isEmpty();
    }

    @Test
    @DisplayName("겹치는 일정이 여럿이면 첫 건을 쓴다 (단건 조회로 받으면 예외가 났을 자리)")
    void getActiveMaintenance_overlapping() {
        // active 는 서비스가 실제 시계로 계산하므로, 여기 일정은 지금을 감싸야 한다
        LocalDateTime now = LocalDateTime.now();
        given(maintenanceRepository.findActive(any())).willReturn(List.of(
                entity(now.minusHours(2), now.plusHours(1), true),
                entity(now.minusHours(1), now.plusHours(3), true)));

        Optional<MaintenanceVo> vo = maintenanceService.getActiveMaintenance();

        assertThat(vo).isPresent();
        assertThat(vo.get().getStartAt()).isEqualTo(now.minusHours(2));
        assertThat(vo.get().getActive()).isTrue();
    }

    // ----- 기간 검증 -----

    @Test
    @DisplayName("종료가 시작보다 앞서면 등록 거부")
    void createMaintenance_reversedPeriod() {
        assertThatThrownBy(() -> maintenanceService.createMaintenance("점검", NOW, NOW.minusHours(1), true))
                .isInstanceOf(InvalidMaintenancePeriodException.class);
    }

    @Test
    @DisplayName("종료와 시작이 같아도 거부 (길이 0 인 점검은 의미가 없다)")
    void createMaintenance_zeroLengthPeriod() {
        assertThatThrownBy(() -> maintenanceService.createMaintenance("점검", NOW, NOW, true))
                .isInstanceOf(InvalidMaintenancePeriodException.class);
    }

    @Test
    @DisplayName("종료 미정은 통과")
    void createMaintenance_openEnded() {
        given(maintenanceRepository.save(any())).willAnswer(i -> i.getArgument(0));

        assertThat(maintenanceService.createMaintenance("점검", NOW, null, true).getEndAt()).isNull();
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
