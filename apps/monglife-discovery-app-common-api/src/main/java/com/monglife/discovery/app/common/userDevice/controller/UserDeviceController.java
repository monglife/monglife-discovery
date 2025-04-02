package com.monglife.discovery.app.common.userDevice.controller;

import com.monglife.core.dto.response.ResponseDto;
import com.monglife.discovery.app.common.userDevice.dto.request.CreateDeviceRequestDto;
import com.monglife.discovery.app.common.userDevice.enums.UserDeviceResponse;
import com.monglife.discovery.app.common.userDevice.service.UserDeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/userDevice")
@RequiredArgsConstructor
public class UserDeviceController {

    private final UserDeviceService userDeviceService;

    /**
     * 플레이어 기기 등록
     * @param createDeviceRequestDto 걸음 수 Dto
     * @return 성공 응답
     */
    @PostMapping("")
    public ResponseEntity<ResponseDto<?>> createAndroidDevice(@RequestBody CreateDeviceRequestDto createDeviceRequestDto) {

        String deviceId = createDeviceRequestDto.getDeviceId();
        String deviceName = createDeviceRequestDto.getDeviceName();
        String fcmToken = createDeviceRequestDto.getFcmToken();

        userDeviceService.createAndroidDevice(deviceId, deviceName, fcmToken);

        return ResponseEntity.ok(UserDeviceResponse.DISCOVERY_APP_USER_DEVICE_CREATE_DEVICE.toResponseDto());
    }
}
