package com.monglife.discovery.domain.account.repository;

import com.monglife.discovery.domain.account.entity.TokenEntity;
import org.springframework.data.repository.CrudRepository;

import java.util.Optional;

public interface TokenRepository extends CrudRepository<TokenEntity, String> {

    Optional<TokenEntity> findByDeviceIdAndAccountId(String deviceId, Long accountId);
}
