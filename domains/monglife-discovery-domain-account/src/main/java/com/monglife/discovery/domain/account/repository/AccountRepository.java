package com.monglife.discovery.domain.account.repository;

import com.monglife.discovery.domain.account.entity.AccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<AccountEntity, Long>, AccountCustomRepository {
}
