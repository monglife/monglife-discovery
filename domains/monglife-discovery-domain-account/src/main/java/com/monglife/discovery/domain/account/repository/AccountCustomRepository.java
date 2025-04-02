package com.monglife.discovery.domain.account.repository;

import com.monglife.discovery.domain.account.entity.AccountEntity;

import java.util.Optional;

public interface AccountCustomRepository {

    Optional<AccountEntity> findByEmail(String email);

    Optional<AccountEntity> findBySocialAccountId(String socialAccountId);

    Optional<AccountEntity> findByAccountId(Long accountId);
}
