package com.monglife.discovery.domain.account.repositoryImpl;

import com.monglife.discovery.domain.account.entity.AccountEntity;
import com.monglife.discovery.domain.account.repository.AccountCustomRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;

import java.util.Optional;

import static com.monglife.discovery.domain.account.entity.QAccountEntity.accountEntity;

@Repository
public class AccountCustomRepositoryImpl implements AccountCustomRepository {

    private final JPAQueryFactory jpaQueryFactory;

    public AccountCustomRepositoryImpl(@Qualifier("accountJpaQueryFactory") JPAQueryFactory jpaQueryFactory) {
        this.jpaQueryFactory = jpaQueryFactory;
    }

    @Override
    public Optional<AccountEntity> findByEmail(String email) {
        return Optional.ofNullable(jpaQueryFactory.selectFrom(accountEntity)
                .where(accountEntity.email.eq(email), accountEntity.isDeleted.eq(false))
                .fetchOne());
    }

    @Override
    public Optional<AccountEntity> findBySocialAccountId(String socialAccountId) {
        return Optional.ofNullable(jpaQueryFactory.selectFrom(accountEntity)
                .where(accountEntity.socialAccountId.eq(socialAccountId), accountEntity.isDeleted.eq(false))
                .fetchOne());
    }

    @Override
    public Optional<AccountEntity> findByAccountId(Long accountId) {
        return Optional.ofNullable(jpaQueryFactory
                .selectFrom(accountEntity)
                .where(accountEntity.accountId.eq(accountId), accountEntity.isDeleted.eq(false))
                .fetchOne());
    }
}
