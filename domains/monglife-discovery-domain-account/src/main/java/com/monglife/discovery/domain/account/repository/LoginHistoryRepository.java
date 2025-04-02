package com.monglife.discovery.domain.account.repository;

import com.monglife.discovery.domain.account.entity.LoginHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginHistoryRepository extends JpaRepository<LoginHistoryEntity, Long>, LoginHistoryCustomRepository {
}
