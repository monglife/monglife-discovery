package com.monglife.discovery.domain.device.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.core.io.ResourceLoader;
import org.springframework.jdbc.datasource.init.DataSourceInitializer;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;

/**
 * device 데이터소스 초기 데이터 적재.
 *
 * 스크립트는 configs 서브모듈에서 온다:
 *   configs/properties/domains/monglife-discovery-domain-device/app_version.sql
 *   → copyPrivate → src/main/resources/app_version.sql → classpath:app_version.sql
 *
 * <p>yml 만으로 되는 길이 없어서 이 빈이 있다.
 * <ul>
 *   <li>부트의 {@code spring.sql.init.*} 은 부트가 <b>자동 구성한 단일</b> 데이터소스에만 걸린다.
 *       이 프로젝트는 account / device 를 직접 만들어 써서 후보가 둘이라 백오프한다.</li>
 *   <li>하이버네이트의 {@code hbm2ddl.import_files} 는 스키마를 <b>생성</b>할 때만 돈다.
 *       dev 의 {@code update}, stg/prd 의 {@code none} 에서는 실행되지 않는다.
 *       게다가 스크립트가 깨져도 WARN 만 찍고 기동을 계속한다.</li>
 *   <li>JPA 표준 {@code jakarta.persistence.sql-load-script-source} 는 스키마 생성을
 *       {@code jakarta.persistence.schema-generation.database.action} 으로 돌릴 때만 걸린다.</li>
 * </ul>
 */
@Slf4j
@Configuration("deviceSqlInitConfig")
public class SqlInitConfig {

    // @Value 는 YAML 리스트를 List<String> 으로 받지 못한다. 여러 개면 콤마로 구분한다.
    @Value("${spring.datasource.device.init.data-locations}")
    private String dataLocations;

    /**
     * hbm2ddl 이 테이블을 만든 뒤에 돌아야 하므로 deviceEntityManager 에 의존을 건다.
     * local 은 create-drop 이라 순서가 뒤집히면 INSERT 가 "테이블 없음" 으로 깨진다.
     *
     * <p>프로파일로 가르지 않고 <b>매 기동마다</b> 돈다. 스크립트가 {@code INSERT IGNORE} 라
     * 이미 있는 행은 건너뛰고 새로 추가된 것만 들어가므로, create-drop(local) · update(dev) ·
     * none(stg/prd) 어디서 돌아도 결과가 같다. 켜고 끄는 스위치는 잊으면 그대로 사고가 된다.
     *
     * <p>{@code continueOnError} 는 기본값(false) 그대로 둔다. 스크립트가 깨지면 기동을 세워야
     * 한다 — 데이터가 안 들어간 채 조용히 뜨면 첫 요청에서야 드러난다.
     */
    @Bean(name = "deviceDataSourceInitializer")
    @DependsOn("deviceEntityManager")
    public DataSourceInitializer deviceDataSourceInitializer(
            @Qualifier("deviceDataSource") DataSource dataSource,
            ResourceLoader resourceLoader
    ) {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        for (String location : StringUtils.commaDelimitedListToStringArray(dataLocations)) {
            populator.addScript(resourceLoader.getResource(location.trim()));
        }

        log.info("[device] 초기 데이터 적재: {}", dataLocations);

        DataSourceInitializer initializer = new DataSourceInitializer();
        initializer.setDataSource(dataSource);
        initializer.setDatabasePopulator(populator);
        return initializer;
    }
}
