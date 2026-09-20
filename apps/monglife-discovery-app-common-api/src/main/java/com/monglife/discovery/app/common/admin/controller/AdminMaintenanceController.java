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
     * 지금 점검 중인 일정. 앱이 받는 것과 같은 판정이라 화면이 서버 시계로 확인할 수 있다.
     * @return 점검 중이 아니면 result 가 null
     */
    @EntryLoggingPoint
    @GetMapping("/current")
    public ResponseEntity<ResponseDto<AdminMaintenanceResponseDto>> current() {
        return ResponseEntity.ok().body(AdminResponse.DISCOVERY_APP_ADMIN_MAINTENANCE_CURRENT.toResponseDto(
                maintenanceService.getActiveMaintenance().map(AdminMaintenanceController::toDto).orElse(null)));
    }

    @EntryLoggingPoint
    @PostMapping
    public ResponseEntity<ResponseDto<AdminMaintenanceResponseDto>> create(@Valid @RequestBody AdminMaintenanceSaveRequestDto dto) {
        return ResponseEntity.ok().body(AdminResponse.DISCOVERY_APP_ADMIN_MAINTENANCE_CREATE.toResponseDto(
                toDto(maintenanceService.createMaintenance(dto.getMessage().trim(), dto.getStartAt(), dto.getEndAt(), dto.getEnabled()))));
    }

    @EntryLoggingPoint
    @PutMapping("/{maintenanceId}")
    public ResponseEntity<ResponseDto<AdminMaintenanceResponseDto>> update(@PathVariable Long maintenanceId, @Valid @RequestBody AdminMaintenanceSaveRequestDto dto) {
        return ResponseEntity.ok().body(AdminResponse.DISCOVERY_APP_ADMIN_MAINTENANCE_UPDATE.toResponseDto(
                toDto(maintenanceService.updateMaintenance(maintenanceId, dto.getMessage().trim(), dto.getStartAt(), dto.getEndAt(), dto.getEnabled()))));
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
