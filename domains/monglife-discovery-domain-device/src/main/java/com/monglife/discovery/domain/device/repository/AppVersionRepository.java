package com.monglife.discovery.domain.device.repository;

import com.monglife.discovery.domain.device.entity.AppVersionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppVersionRepository extends JpaRepository<AppVersionEntity, Long> {

    Optional<AppVersionEntity> findByAppPackageNameAndBuildVersion(String appPackageName, String buildVersion);
}
