package com.monglife.discovery.domain.account.repositoryImpl;

import com.monglife.discovery.domain.account.entity.LoginHistoryEntity;
import com.monglife.discovery.domain.account.repository.LoginHistoryCustomRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

import static com.monglife.discovery.domain.account.entity.QLoginHistoryEntity.loginHistoryEntity;

@Repository
public class LoginHistoryCustomRepositoryImpl implements LoginHistoryCustomRepository {

    private final JPAQueryFactory jpaQueryFactory;

    public LoginHistoryCustomRepositoryImpl(@Qualifier("accountJpaQueryFactory") JPAQueryFactory jpaQueryFactory) {
        this.jpaQueryFactory = jpaQueryFactory;
    }

    @Override
    public Optional<LoginHistoryEntity> findByAccountIdAndDeviceIdAndLoginAt(Long accountId, String deviceId, LocalDate loginAt) {
        return Optional.ofNullable(jpaQueryFactory
                .selectFrom(loginHistoryEntity)
                .where(loginHistoryEntity.accountId.eq(accountId), loginHistoryEntity.deviceId.eq(deviceId), loginHistoryEntity.loginAt.eq(loginAt))
                .fetchOne());
    }
}
