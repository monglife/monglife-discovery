package com.monglife.discovery.app.common.userDevice.service;

import com.monglife.discovery.domain.device.service.DeviceService;
import com.monglife.discovery.domain.device.vo.DeviceVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserDeviceService {

    private final DeviceService deviceService;

    /**
     * 기기 등록
     * @param deviceId 기기 ID
     * @param fcmToken FCM 토큰
     */
    @Transactional
    public void createAndroidDevice(String deviceId, String deviceName, String fcmToken) {

        DeviceVo deviceVo = deviceService.createDevice(deviceId, deviceName, fcmToken);

        // FCM 토큰 갱신
        if (deviceVo.getFcmToken().isBlank() || !deviceVo.getFcmToken().equals(fcmToken)) {
            deviceService.updateDevice(deviceId, fcmToken);
        }
    }

    /**
     * 기기 연결
     * @param accountId 계정 ID
     * @param deviceId 기기 ID
     */
    @Transactional
    public void connectAndroidDevice(Long accountId, String deviceId) {
        deviceService.connectAccountId(deviceId, accountId);
    }

    /**
     * 기기 연결 해제
     * @param accountId 계정 ID
     * @param deviceId 기기 ID
     */
    @Transactional
    public void disconnectAndroidDevice(Long accountId, String deviceId) {
        deviceService.disconnectAccountId(deviceId, accountId);
    }
}
