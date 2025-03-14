package com.monglife.discovery.app.common.userDevice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateDeviceRequestDto {

    @NotBlank
    private String deviceId;

    @NotBlank
    private String deviceName;

    @NotBlank
    private String appPackageName;

    @NotBlank
    private String fcmToken;

    @Builder
    public CreateDeviceRequestDto(String deviceId, String deviceName, String appPackageName, String fcmToken) {
        this.deviceId = deviceId;
        this.deviceName = deviceName;
        this.appPackageName = appPackageName;
        this.fcmToken = fcmToken;
    }
}
