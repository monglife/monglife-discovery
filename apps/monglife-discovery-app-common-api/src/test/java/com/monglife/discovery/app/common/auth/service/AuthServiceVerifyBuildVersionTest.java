package com.monglife.discovery.app.common.auth.service;

import com.monglife.discovery.app.common.auth.dto.etc.VerifyBuildVersionDto;
import com.monglife.discovery.app.common.global.provider.AppleIdTokenProvider;
import com.monglife.discovery.app.common.global.provider.GoogleIdTokenProvider;
import com.monglife.discovery.app.common.global.provider.TokenProvider;
import com.monglife.discovery.domain.account.service.AccountService;
import com.monglife.discovery.domain.account.service.LoginHistoryService;
import com.monglife.discovery.domain.account.service.TokenService;
import com.monglife.discovery.domain.device.exception.NotExistsAppVersionException;
import com.monglife.discovery.domain.device.service.AppVersionService;
import com.monglife.discovery.domain.device.service.MaintenanceService;
import com.monglife.discovery.domain.device.vo.AppVersionVo;
import com.monglife.discovery.domain.device.vo.MaintenanceVo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService 앱 버전 검증 (+ 서버 점검)")
class AuthServiceVerifyBuildVersionTest {

    private static final String APP_PACKAGE_NAME = "com.mongs.wear";
    private static final String BUILD_VERSION = "2.2.1";
    private static final LocalDateTime START_AT = LocalDateTime.of(2026, 9, 21, 2, 0);
    private static final LocalDateTime END_AT = LocalDateTime.of(2026, 9, 21, 4, 0);

    @Mock private AccountService accountService;
    @Mock private AppVersionService appVersionService;
    @Mock private MaintenanceService maintenanceService;
    @Mock private TokenService tokenService;
    @Mock private LoginHistoryService loginHistoryService;
    @Mock private TokenProvider tokenProvider;
    @Mock private GoogleIdTokenProvider googleIdTokenProvider;
    @Mock private AppleIdTokenProvider appleIdTokenProvider;

    @InjectMocks private AuthService authService;

    private void givenAppVersion(boolean mustUpdate) {
        given(appVersionService.getAppVersion(APP_PACKAGE_NAME, BUILD_VERSION)).willReturn(AppVersionVo.builder()
                .appPackageName(APP_PACKAGE_NAME)
                .buildVersion(BUILD_VERSION)
                .mustUpdate(mustUpdate)
                .build());
    }

    private VerifyBuildVersionDto verify() {
        return authService.verifyBuildVersion(APP_PACKAGE_NAME, BUILD_VERSION);
    }

    @Test
    @DisplayName("점검 중이 아니면 underMaintenance 는 false 이고 점검 정보는 비어 있다")
    void noMaintenance() {
        givenAppVersion(false);
        given(maintenanceService.getActiveMaintenance()).willReturn(Optional.empty());

        VerifyBuildVersionDto dto = verify();

        assertThat(dto.getMustUpdate()).isFalse();
        assertThat(dto.getUnderMaintenance()).isFalse();
        assertThat(dto.getMaintenanceMessage()).isNull();
        assertThat(dto.getMaintenanceStartAt()).isNull();
        assertThat(dto.getMaintenanceEndAt()).isNull();
    }

    @Test
    @DisplayName("점검 중이면 문구와 시작·종료 시각이 함께 나간다")
    void underMaintenance() {
        givenAppVersion(false);
        given(maintenanceService.getActiveMaintenance()).willReturn(Optional.of(MaintenanceVo.builder()
                .maintenanceId(1L)
                .message("서버 점검 중입니다.")
                .startAt(START_AT)
                .endAt(END_AT)
                .enabled(true)
                .active(true)
                .build()));

        VerifyBuildVersionDto dto = verify();

        assertThat(dto.getUnderMaintenance()).isTrue();
        assertThat(dto.getMaintenanceMessage()).isEqualTo("서버 점검 중입니다.");
        assertThat(dto.getMaintenanceStartAt()).isEqualTo(START_AT);
        assertThat(dto.getMaintenanceEndAt()).isEqualTo(END_AT);
    }

    @Test
    @DisplayName("종료 미정인 점검이면 endAt 만 null 이다")
    void underMaintenance_openEnded() {
        givenAppVersion(false);
        given(maintenanceService.getActiveMaintenance()).willReturn(Optional.of(MaintenanceVo.builder()
                .maintenanceId(1L)
                .message("긴급 점검 중입니다.")
                .startAt(START_AT)
                .endAt(null)
                .enabled(true)
                .active(true)
                .build()));

        VerifyBuildVersionDto dto = verify();

        assertThat(dto.getUnderMaintenance()).isTrue();
        assertThat(dto.getMaintenanceStartAt()).isEqualTo(START_AT);
        assertThat(dto.getMaintenanceEndAt()).isNull();
    }

    @Test
    @DisplayName("강제 업데이트와 점검은 함께 나갈 수 있다 (앱이 업데이트를 먼저 본다)")
    void mustUpdateAndMaintenance() {
        givenAppVersion(true);
        given(maintenanceService.getActiveMaintenance()).willReturn(Optional.of(MaintenanceVo.builder()
                .maintenanceId(1L)
                .message("서버 점검 중입니다.")
                .startAt(START_AT)
                .endAt(END_AT)
                .enabled(true)
                .active(true)
                .build()));

        VerifyBuildVersionDto dto = verify();

        assertThat(dto.getMustUpdate()).isTrue();
        assertThat(dto.getUnderMaintenance()).isTrue();
    }

    @Test
    @DisplayName("등록되지 않은 버전이면 점검을 읽기 전에 예외 — 기존 동작 그대로다")
    void unknownBuildVersion() {
        given(appVersionService.getAppVersion(anyString(), anyString()))
                .willThrow(new NotExistsAppVersionException(APP_PACKAGE_NAME, "9.9.9"));

        assertThatThrownBy(() -> authService.verifyBuildVersion(APP_PACKAGE_NAME, "9.9.9"))
                .isInstanceOf(NotExistsAppVersionException.class);
    }
}
