package com.monglife.discovery.domain.account.service;

import com.monglife.discovery.domain.account.entity.LoginHistoryEntity;
import com.monglife.discovery.domain.account.repository.LoginHistoryRepository;
import com.monglife.discovery.domain.account.vo.LoginHistoryVo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoginHistoryService {

    private final LoginHistoryRepository loginHistoryRepository;

    /**
     * 로그인 기록 갱신
     */
    @Transactional
    public void patchLoginHistory(LoginHistoryVo loginHistoryVo) {

        log.info("LoginHistoryVo : {}", loginHistoryVo);

        LoginHistoryEntity loginHistoryEntity = loginHistoryRepository.findByAccountIdAndDeviceIdAndLoginAt(loginHistoryVo.getAccountId(), loginHistoryVo.getDeviceId(), LocalDate.now())
                .orElseGet(() -> loginHistoryRepository.save(LoginHistoryEntity.builder()
                        .accountId(loginHistoryVo.getAccountId())
                        .deviceId(loginHistoryVo.getDeviceId())
                        .appPackageName(loginHistoryVo.getAppPackageName())
                        .deviceName(loginHistoryVo.getDeviceName())
                        .buildVersion(loginHistoryVo.getBuildVersion())
                        .build()));

        loginHistoryEntity.increaseLoginCount();
    }
}
