package com.monglife.discovery.app.common.admin.controller;

import com.monglife.core.dto.response.PageResponseDto;
import com.monglife.core.dto.response.ResponseDto;
import com.monglife.discovery.app.common.admin.dto.request.*;
import com.monglife.discovery.app.common.admin.dto.response.*;
import com.monglife.discovery.app.common.admin.enums.AdminResponse;
import com.monglife.discovery.app.common.admin.service.*;
import com.monglife.discovery.app.common.admin.util.PageQuery;
import com.monglife.discovery.app.common.admin.util.SortSpec;
import com.monglife.module.common.logging.annotation.EntryLoggingPoint;
import com.monglife.module.common.security.principal.Passport;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/accounts")
public class AdminAccountController {

    private final AdminAccountService adminAccountService;

    @EntryLoggingPoint
    @GetMapping
    public ResponseEntity<PageResponseDto<List<AdminAccountResponseDto>>> list(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sort
    ) {
        SortSpec sortSpec = SortSpec.parse(sort, AdminAccountService.SORT_KEYS, "accountId", true);
        return adminAccountService.getAccounts(
                PageQuery.blankToNull(query), PageQuery.blankToNull(platform), PageQuery.blankToNull(role), PageQuery.blankToNull(status),
                PageQuery.page(page), PageQuery.size(size), sortSpec
        ).toResponse(AdminResponse.DISCOVERY_APP_ADMIN_ACCOUNT_LIST);
    }

    /**
     * 계정 ID 목록으로 이름표만 조회. mongs 관리 화면이 계정 ID 만 들고 있어서
     * 목록에 이메일을 함께 보여 주려면 이 조회가 필요하다.
     */
    @EntryLoggingPoint
    @GetMapping("/summaries")
    public ResponseEntity<ResponseDto<List<AdminAccountSummaryResponseDto>>> summaries(@RequestParam List<Long> accountIds) {
        return ResponseEntity.ok().body(AdminResponse.DISCOVERY_APP_ADMIN_ACCOUNT_SUMMARIES.toResponseDto(adminAccountService.getSummaries(accountIds)));
    }

    @EntryLoggingPoint
    @GetMapping("/{accountId}")
    public ResponseEntity<ResponseDto<AdminAccountResponseDto>> get(@PathVariable Long accountId) {
        return ResponseEntity.ok().body(AdminResponse.DISCOVERY_APP_ADMIN_ACCOUNT_GET.toResponseDto(adminAccountService.getAccount(accountId)));
    }

    @EntryLoggingPoint
    @GetMapping("/{accountId}/devices")
    public ResponseEntity<ResponseDto<List<AdminDeviceResponseDto>>> devices(@PathVariable Long accountId) {
        return ResponseEntity.ok().body(AdminResponse.DISCOVERY_APP_ADMIN_DEVICE_LIST.toResponseDto(adminAccountService.getDevices(accountId)));
    }

    @EntryLoggingPoint
    @GetMapping("/{accountId}/login-histories")
    public ResponseEntity<ResponseDto<List<AdminLoginHistoryResponseDto>>> loginHistories(@PathVariable Long accountId) {
        return ResponseEntity.ok().body(AdminResponse.DISCOVERY_APP_ADMIN_ACCOUNT_GET.toResponseDto(adminAccountService.getLoginHistories(accountId)));
    }

    @EntryLoggingPoint
    @PatchMapping("/{accountId}")
    public ResponseEntity<ResponseDto<AdminAccountResponseDto>> patch(@PathVariable Long accountId, @Valid @RequestBody AdminAccountPatchRequestDto dto) {
        AdminAccountResponseDto updated = adminAccountService.updateAccount(accountId, dto.getName(), dto.getRole(), dto.getIsDeleted());
        return ResponseEntity.ok().body(AdminResponse.DISCOVERY_APP_ADMIN_ACCOUNT_UPDATE.toResponseDto(updated));
    }
}
