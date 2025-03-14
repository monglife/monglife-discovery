package com.monglife.discovery.domain.account.repository;

import com.monglife.discovery.domain.account.entity.LoginHistoryEntity;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface LoginHistoryCustomRepository {

    Optional<LoginHistoryEntity> findByAccountIdAndDeviceIdAndLoginAt(Long accountId, String deviceId, LocalDate loginAt);
}
