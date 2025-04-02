package com.monglife.discovery.domain.account.config;

import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QueryDSLConfig {

    @Bean(name = "accountJpaQueryFactory")
    public JPAQueryFactory jpaQueryFactory(@Qualifier("accountEntityManager") EntityManager entityManager){
        return new JPAQueryFactory(entityManager);
    }
}