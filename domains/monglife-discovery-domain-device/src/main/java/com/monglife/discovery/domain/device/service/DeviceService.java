package com.monglife.discovery.domain.device.service;

import com.monglife.discovery.domain.device.entity.DeviceEntity;
import com.monglife.discovery.domain.device.exception.NotExistsDeviceException;
import com.monglife.discovery.domain.device.repository.DeviceRepository;
import com.monglife.discovery.domain.device.vo.DeviceVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;

    /**
     * 기기 정보 등록
     * @param deviceId 기기 ID
     * @param deviceName 기기명
     * @param fcmToken FCM 토큰
     */
    @Transactional
    public DeviceVo createDevice(String deviceId, String deviceName, String fcmToken) {

        // 기존 기기 정보가 존재하지 않는 경우 등록
        DeviceEntity deviceEntity = deviceRepository.findByDeviceId(deviceId)
                .orElseGet(() -> deviceRepository.save(DeviceEntity.builder()
                        .deviceId(deviceId)
                        .deviceName(deviceName)
                        .fcmToken(fcmToken)
                        .build()));

        return DeviceVo.builder()
                .deviceId(deviceEntity.getDeviceId())
                .deviceName(deviceEntity.getDeviceName())
                .fcmToken(deviceEntity.getFcmToken())
                .build();
    }

    /**
     * 기기 정보 목록 조회
     * @param accountId 계정 ID
     * @return 기기 정보 Vo 목록
     */
    @Transactional(readOnly = true)
    public List<DeviceVo> getDevices(Long accountId) {

        List<DeviceEntity> deviceEntities = deviceRepository.findByAccountId(accountId);

        return deviceEntities.stream()
                .map(deviceEntity -> DeviceVo.builder()
                        .deviceId(deviceEntity.getDeviceId())
                        .deviceName(deviceEntity.getDeviceName())
                        .fcmToken(deviceEntity.getFcmToken())
                        .build())
                .toList();
    }

    /**
     * FCM 토큰 업데이트
     * @param deviceId 기기 ID
     * @param fcmToken FCM 토큰
     */
    @Transactional
    public void updateDevice(String deviceId, String fcmToken) {

        DeviceEntity deviceEntity = deviceRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new NotExistsDeviceException(deviceId));

        deviceEntity.setFcmToken(fcmToken);
    }

    /**
     * 계정 ID 연결
     * @param deviceId 기기 ID
     * @param accountId 계정 ID
     */
    @Transactional
    public void connectAccountId(String deviceId, Long accountId) {

        DeviceEntity deviceEntity = deviceRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new NotExistsDeviceException(deviceId));

        deviceEntity.connectAccount(accountId);
    }

    /**
     * 계정 ID 연결 해제
     * @param deviceId 기기 ID
     * @param accountId 계정 ID
     */
    @Transactional
    public void disconnectAccountId(String deviceId, Long accountId) {

        DeviceEntity deviceEntity = deviceRepository.findByAccountIdAndDeviceId(accountId, deviceId)
                .orElseThrow(() -> new NotExistsDeviceException(deviceId));

        deviceEntity.disconnectAccount();
    }
}
