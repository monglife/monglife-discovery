package com.monglife.discovery.domain.account.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.hibernate.cfg.AvailableSettings;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.hibernate5.SpringBeanContainer;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.Properties;

@Configuration("accountDataSourceConfig")
@EnableTransactionManagement
@EnableJpaRepositories(
        basePackages = "com.monglife.discovery.domain.account.repository",
        entityManagerFactoryRef = "accountEntityManager",
        transactionManagerRef = "accountTransactionManager"
)
public class DataSourceConfig {

    @Value("${spring.jpa.account.properties.hibernate.dialect}")
    private String dialect;

    @Value("${spring.jpa.account.properties.hibernate.hbm2ddl.auto}")
    private String ddlAuto;

    @Value("${spring.jpa.account.properties.hibernate.show_sql}")
    private String showSql;

    @Value("${spring.jpa.account.properties.hibernate.format_sql}")
    private String formatSql;

    @Bean(name = "accountDataSourceProperties")
    @ConfigurationProperties(prefix = "spring.datasource.account.hikari")
    public HikariConfig dataSourceProperties() {
        return new HikariConfig();
    }

    @Bean(name = "accountDataSource")
    public DataSource dataSource(@Qualifier("accountDataSourceProperties") HikariConfig dataSourceProperties) {
        return new HikariDataSource(dataSourceProperties);
    }

    @Bean(name = "accountJpaProperties")
    public Properties jpaProperties(@Qualifier("hibernateProperties") Properties hibernateProperties, ConfigurableListableBeanFactory beanFactory) {
        Properties jpaProperties = new Properties();
        jpaProperties.put(AvailableSettings.DIALECT, dialect);
        jpaProperties.put(AvailableSettings.HBM2DDL_AUTO, ddlAuto);
        jpaProperties.put(AvailableSettings.SHOW_SQL, showSql);
        jpaProperties.put(AvailableSettings.FORMAT_SQL, formatSql);
        jpaProperties.put(AvailableSettings.BEAN_CONTAINER, new SpringBeanContainer(beanFactory));
        jpaProperties.putAll(hibernateProperties);
        return jpaProperties;
    }

    @Bean(name = "accountEntityManager")
    public LocalContainerEntityManagerFactoryBean entityManager(@Qualifier("accountDataSource") DataSource dataSource, @Qualifier("accountJpaProperties") Properties jpaProperties) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.monglife.discovery.domain.account.entity");
        em.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
        em.setJpaProperties(jpaProperties);
        return em;
    }

    @Bean(name = "accountTransactionManager")
    public PlatformTransactionManager transactionManager(@Qualifier("accountEntityManager") LocalContainerEntityManagerFactoryBean entityManager) {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(entityManager.getObject());
        return transactionManager;
    }
}
