package com.monglife.discovery.domain.device.entity;

import com.monglife.module.common.jpa.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners({ AuditingEntityListener.class })
@Table(name = "monglife_device")
public class DeviceEntity extends BaseTimeEntity {

    @Id
    @Column(name = "device_id", unique = true)
    private String deviceId;

    @Column(name = "device_name")
    private String deviceName;

    @Setter
    @Column(name = "fcm_token")
    private String fcmToken;

    @Column(name = "account_id")
    private Long accountId;

    @Builder
    public DeviceEntity(String deviceId, String deviceName, String fcmToken) {
        this.deviceId = deviceId;
        this.deviceName = deviceName;
        this.fcmToken = fcmToken;
    }

    public void connectAccount(Long accountId) {
        this.accountId = accountId;
    }

    public void disconnectAccount() {
        this.accountId = null;
    }
}
