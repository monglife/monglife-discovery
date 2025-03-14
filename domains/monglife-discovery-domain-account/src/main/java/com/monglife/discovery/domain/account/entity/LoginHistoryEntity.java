package com.monglife.discovery.domain.account.entity;

import com.monglife.module.common.jpa.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "monglife_login_history")
public class LoginHistoryEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long accountLogId;

    @Column(name = "account_id", updatable = false, nullable = false)
    private Long accountId;

    @Column(updatable = false, nullable = false)
    private String deviceId;

    @Column(nullable = false)
    private String appPackageName;

    @Column
    private String deviceName;

    @Column(nullable = false)
    private String buildVersion;

    @Column(updatable = false, nullable = false)
    @CreatedDate
    private LocalDate loginAt;

    @Column(nullable = false)
    private Integer loginCount;

    public void increaseLoginCount() {
        this.loginCount++;
    }

    @Builder
    public LoginHistoryEntity(Long accountId, String deviceId, String appPackageName, String deviceName, String buildVersion, LocalDate loginAt) {
        this.accountId = accountId;
        this.deviceId = deviceId;
        this.appPackageName = appPackageName;
        this.deviceName = deviceName;
        this.buildVersion = buildVersion;
        this.loginAt = loginAt;
        this.loginCount = 0;
    }
}
