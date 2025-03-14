package com.monglife.discovery.domain.account.entity;

import com.monglife.core.enums.role.RoleCode;
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
@Table(name = "monglife_account")
public class AccountEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long accountId;

    @Column
    private String socialAccountId;

    @Column(updatable = false, nullable = false)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Boolean isDeleted = false;

    @Column(nullable = false)
    private String role = RoleCode.NORMAL.getRole();

    @Builder
    public AccountEntity(String socialAccountId, String email, String name, String role) {
        this.socialAccountId = socialAccountId;
        this.email = email;
        this.name = name;
        this.isDeleted = false;
        this.role = role;
    }

    public void updateSocialAccountId(String socialAccountId) {
        this.socialAccountId = socialAccountId;
    }
}
