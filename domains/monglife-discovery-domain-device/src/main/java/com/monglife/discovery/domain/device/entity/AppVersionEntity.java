package com.monglife.discovery.domain.device.entity;

import com.monglife.module.common.jpa.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "monglife_app_version")
public class AppVersionEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long appVersionId;

    @Column(nullable = false)
    private String appPackageName;

    @Column(nullable = false, updatable = false)
    private String buildVersion;

    @Column(nullable = false)
    private Boolean mustUpdate;


    @Builder
    public AppVersionEntity(String appPackageName, String buildVersion, Boolean mustUpdate) {
        this.appPackageName = appPackageName;
        this.buildVersion = buildVersion;
        this.mustUpdate = mustUpdate;
    }
}