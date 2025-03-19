package com.monglife.discovery.domain.device.config;

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

@Configuration("deviceDataSourceConfig")
@EnableTransactionManagement
@EnableJpaRepositories(
        basePackages = "com.monglife.discovery.domain.device.repository",
        entityManagerFactoryRef = "deviceEntityManager",
        transactionManagerRef = "deviceTransactionManager"
)
public class DataSourceConfig {

    @Value("${spring.jpa.device.properties.hibernate.dialect}")
    private String dialect;

    @Value("${spring.jpa.device.properties.hibernate.hbm2ddl.auto}")
    private String ddlAuto;

    @Value("${spring.jpa.device.properties.hibernate.show_sql}")
    private String showSql;

    @Value("${spring.jpa.device.properties.hibernate.format_sql}")
    private String formatSql;

    @Bean(name = "deviceDataSourceProperties")
    @ConfigurationProperties(prefix = "spring.datasource.device.hikari")
    public HikariConfig dataSourceProperties() {
        return new HikariConfig();
    }

    @Bean(name = "deviceDataSource")
    public DataSource dataSource(@Qualifier("deviceDataSourceProperties") HikariConfig dataSourceProperties) {
        return new HikariDataSource(dataSourceProperties);
    }

    @Bean(name = "deviceJpaProperties")
    public Properties deviceJpaProperties(@Qualifier("hibernateProperties") Properties hibernateProperties, ConfigurableListableBeanFactory beanFactory) {
        Properties jpaProperties = new Properties();
        jpaProperties.put(AvailableSettings.DIALECT, dialect);
        jpaProperties.put(AvailableSettings.HBM2DDL_AUTO, ddlAuto);
        jpaProperties.put(AvailableSettings.SHOW_SQL, showSql);
        jpaProperties.put(AvailableSettings.FORMAT_SQL, formatSql);
        jpaProperties.put(AvailableSettings.BEAN_CONTAINER, new SpringBeanContainer(beanFactory));
        jpaProperties.putAll(hibernateProperties);
        return jpaProperties;
    }

    @Bean(name = "deviceEntityManager")
    public LocalContainerEntityManagerFactoryBean deviceEntityManager(@Qualifier("deviceDataSource") DataSource dataSource, @Qualifier("deviceJpaProperties") Properties jpaProperties) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.monglife.discovery.domain.device.entity");
        em.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
        em.setJpaProperties(jpaProperties);
        return em;
    }

    @Bean(name = "deviceTransactionManager")
    public PlatformTransactionManager deviceTransactionManager(@Qualifier("deviceEntityManager") LocalContainerEntityManagerFactoryBean entityManager) {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(entityManager.getObject());
        return transactionManager;
    }
}
