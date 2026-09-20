package com.monglife.discovery.app.common.admin.controller;

import com.monglife.core.dto.response.ResponseDto;
import com.monglife.discovery.app.common.admin.dto.request.AdminMaintenancePatchRequestDto;
import com.monglife.discovery.app.common.admin.dto.request.AdminMaintenanceSaveRequestDto;
import com.monglife.discovery.app.common.admin.dto.response.AdminMaintenanceResponseDto;
import com.monglife.discovery.app.common.admin.enums.AdminResponse;
import com.monglife.discovery.domain.device.service.MaintenanceService;
import com.monglife.discovery.domain.device.vo.MaintenanceVo;
import com.monglife.module.common.logging.annotation.EntryLoggingPoint;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 서버 점검 일정 관리.
 *
 * <p>앱 버전과 나란히 두지 않고 따로 뺐다 — 점검은 버전이 아니라 서버 쪽 상태다.
 */
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/maintenances")
public class AdminMaintenanceController {

    private final MaintenanceService maintenanceService;

    @EntryLoggingPoint
    @GetMapping
    public ResponseEntity<ResponseDto<List<AdminMaintenanceResponseDto>>> list() {
        List<AdminMaintenanceResponseDto> items = maintenanceService.getMaintenances().stream().map(AdminMaintenanceController::toDto).toList();
        return ResponseEntity.ok().body(AdminResponse.DISCOVERY_APP_ADMIN_MAINTENANCE_LIST.toResponseDto(items));
    }

    /**
     * 지금 진행 중인 점검 일정 전부. 서버 시계로 판정한 것이라 화면의 브라우저 시계와 무관하다.
     *
     * <p><b>앱을 가리지 않는다.</b> 진입 게이트는 "이 앱이 막히나" 를 묻지만 관리자는
     * "지금 뭐가 걸려 있나" 를 봐야 한다. 앱별 점검이 생긴 뒤로는 단건으로 줄 수 없어
     * 목록이다 - 웨어와 iOS 를 따로 내린 동안에는 둘 다 걸려 있다.
     *
     * @return 점검 중이 아니면 빈 배열
     */
    @EntryLoggingPoint
    @GetMapping("/current")
    public ResponseEntity<ResponseDto<List<AdminMaintenanceResponseDto>>> current() {
        List<AdminMaintenanceResponseDto> items = maintenanceService.getActiveMaintenances().stream().map(AdminMaintenanceController::toDto).toList();
        return ResponseEntity.ok().body(AdminResponse.DISCOVERY_APP_ADMIN_MAINTENANCE_CURRENT.toResponseDto(items));
    }

    @EntryLoggingPoint
    @PostMapping
    public ResponseEntity<ResponseDto<AdminMaintenanceResponseDto>> create(@Valid @RequestBody AdminMaintenanceSaveRequestDto dto) {
        return ResponseEntity.ok().body(AdminResponse.DISCOVERY_APP_ADMIN_MAINTENANCE_CREATE.toResponseDto(
                toDto(maintenanceService.createMaintenance(dto.getAppPackageName(), dto.getMessage().trim(), dto.getStartAt(), dto.getEndAt(), dto.getEnabled()))));
    }

    @EntryLoggingPoint
    @PutMapping("/{maintenanceId}")
    public ResponseEntity<ResponseDto<AdminMaintenanceResponseDto>> update(@PathVariable Long maintenanceId, @Valid @RequestBody AdminMaintenanceSaveRequestDto dto) {
        return ResponseEntity.ok().body(AdminResponse.DISCOVERY_APP_ADMIN_MAINTENANCE_UPDATE.toResponseDto(
                toDto(maintenanceService.updateMaintenance(maintenanceId, dto.getAppPackageName(), dto.getMessage().trim(), dto.getStartAt(), dto.getEndAt(), dto.getEnabled()))));
    }

    /** 목록에서 스위치로 끄고 켜는 용. 시각·문구는 건드리지 않는다 */
    @EntryLoggingPoint
    @PatchMapping("/{maintenanceId}")
    public ResponseEntity<ResponseDto<AdminMaintenanceResponseDto>> patch(@PathVariable Long maintenanceId, @Valid @RequestBody AdminMaintenancePatchRequestDto dto) {
        return ResponseEntity.ok().body(AdminResponse.DISCOVERY_APP_ADMIN_MAINTENANCE_UPDATE.toResponseDto(
                toDto(maintenanceService.updateEnabled(maintenanceId, dto.getEnabled()))));
    }

    @EntryLoggingPoint
    @DeleteMapping("/{maintenanceId}")
    public ResponseEntity<ResponseDto<?>> delete(@PathVariable Long maintenanceId) {
        maintenanceService.deleteMaintenance(maintenanceId);
        return ResponseEntity.ok().body(AdminResponse.DISCOVERY_APP_ADMIN_MAINTENANCE_DELETE.toResponseDto());
    }

    private static AdminMaintenanceResponseDto toDto(MaintenanceVo v) {
        return AdminMaintenanceResponseDto.builder()
                .maintenanceId(v.getMaintenanceId())
                .appPackageName(v.getAppPackageName())
                .message(v.getMessage())
                .startAt(v.getStartAt())
                .endAt(v.getEndAt())
                .enabled(v.getEnabled())
                .active(v.getActive())
                .createdAt(v.getCreatedAt())
                .updatedAt(v.getUpdatedAt())
                .build();
    }
}
