package com.monglife.discovery.app.common.admin.service;

import com.monglife.discovery.app.common.admin.dto.response.AdminAccountResponseDto;
import com.monglife.discovery.app.common.admin.dto.response.AdminAccountSummaryResponseDto;
import com.monglife.discovery.app.common.admin.dto.response.AdminDeviceResponseDto;
import com.monglife.discovery.app.common.admin.dto.response.AdminLoginHistoryResponseDto;
import com.monglife.discovery.app.common.admin.util.AdminPage;
import com.monglife.discovery.app.common.admin.util.SortSpec;
import com.monglife.discovery.domain.account.service.AccountService;
import com.monglife.discovery.domain.account.service.LoginHistoryService;
import com.monglife.discovery.domain.account.service.TokenService;
import com.monglife.discovery.domain.account.vo.AccountSearchVo;
import com.monglife.discovery.domain.account.vo.AccountVo;
import com.monglife.discovery.domain.account.vo.PageVo;
import com.monglife.discovery.domain.device.service.DeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminAccountService {

    public static final Set<String> SORT_KEYS = Set.of("accountId", "createdAt");

    /** 한 번에 물어볼 수 있는 계정 수 상한 */
    private static final int MAX_SUMMARY_IDS = 200;

    private final AccountService accountService;
    private final DeviceService deviceService;
    private final LoginHistoryService loginHistoryService;
    private final TokenService tokenService;

    @Transactional(readOnly = true)
    public AdminPage<AdminAccountResponseDto> getAccounts(String query, String platform, String role, String status, int page, int size, SortSpec sort) {
        Boolean isDeleted = status == null ? null : "DELETED".equalsIgnoreCase(status);
        PageVo<AccountVo> result = accountService.getAccounts(AccountSearchVo.builder()
                .query(query)
                .platform(platform == null ? null : platform.toUpperCase())
                .role(role)
                .isDeleted(isDeleted)
                .page(page)
                .size(size)
                .sortKey(sort.key())
                .sortDesc(sort.desc())
                .build());
        return new AdminPage<>(result.getItems().stream().map(AdminMapper::account).toList(), page, size, result.getTotal());
    }

    @Transactional(readOnly = true)
    public AdminAccountResponseDto getAccount(Long accountId) {
        return AdminMapper.account(accountService.getAccountIncludingDeleted(accountId));
    }

    @Transactional(readOnly = true)
    public List<AdminDeviceResponseDto> getDevices(Long accountId) {
        AccountVo account = accountService.getAccountIncludingDeleted(accountId);
        Map<Long, AccountVo> accounts = Map.of(account.getAccountId(), account);
        return deviceService.getDevices(accountId).stream().map(d -> AdminMapper.device(d, accounts)).toList();
    }

    @Transactional(readOnly = true)
    public List<AdminLoginHistoryResponseDto> getLoginHistories(Long accountId) {
        return loginHistoryService.getLoginHistories(accountId).stream().map(AdminMapper::loginHistory).toList();
    }

    /**
     * 수정. 탈퇴 처리(isDeleted=true) 하면 기기 연결과 세션도 정리한다.
     */
    @Transactional
    public AdminAccountResponseDto updateAccount(Long accountId, String name, String role, Boolean isDeleted) {
        AccountVo updated = accountService.updateAccount(accountId, name, role, isDeleted);
        if (Boolean.TRUE.equals(isDeleted)) {
            deviceService.disconnectAll(accountId);
            tokenService.deleteTokensByAccountId(accountId);
        }
        return AdminMapper.account(updated);
    }

    /**
     * 계정 ID 목록 → 이름표. 없는 ID 는 응답에서 빠진다(호출 쪽이 '-' 로 채운다).
     * 한 번에 너무 많이 물어보지 못하게 상한을 둔다.
     */
    @Transactional(readOnly = true)
    public List<AdminAccountSummaryResponseDto> getSummaries(Collection<Long> accountIds) {
        if (accountIds == null || accountIds.isEmpty()) return List.of();
        List<Long> limited = accountIds.stream().distinct().limit(MAX_SUMMARY_IDS).toList();
        return accountService.getAccounts(limited).stream()
                .map(account -> AdminAccountSummaryResponseDto.builder()
                        .accountId(account.getAccountId())
                        .email(account.getEmail())
                        .name(account.getName())
                        .isDeleted(account.getIsDeleted())
                        .build())
                .toList();
    }

    /** 여러 곳에서 쓰는 계정 조인 */
    @Transactional(readOnly = true)
    public Map<Long, AccountVo> accountMap(Collection<Long> accountIds) {
        if (accountIds.isEmpty()) return Map.of();
        return accountService.getAccounts(accountIds).stream()
                .collect(Collectors.toMap(AccountVo::getAccountId, Function.identity(), (a, b) -> a));
    }

    /** 검색어가 계정 이메일·이름과 매칭되는 계정 ID (다른 도메인의 query 확장용) */
    @Transactional(readOnly = true)
    public List<Long> accountIdsByQuery(String query) {
        if (query == null || query.isBlank()) return List.of();
        return accountService.getAccountIdsByQuery(query.trim());
    }
}
