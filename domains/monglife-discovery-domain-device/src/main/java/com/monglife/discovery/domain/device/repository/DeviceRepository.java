package com.monglife.discovery.domain.device.repository;

import com.monglife.discovery.domain.device.entity.DeviceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeviceRepository extends JpaRepository<DeviceEntity, Long> {

    Optional<DeviceEntity> findByDeviceId(String deviceId);

    List<DeviceEntity> findByAccountId(Long accountId);

    Optional<DeviceEntity> findByAccountIdAndDeviceId(Long accountId, String deviceId);
}
