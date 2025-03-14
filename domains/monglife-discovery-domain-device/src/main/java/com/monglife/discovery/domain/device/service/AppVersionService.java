package com.monglife.discovery.domain.device.service;

import com.monglife.discovery.domain.device.entity.AppVersionEntity;
import com.monglife.discovery.domain.device.exception.NotExistsAppVersionException;
import com.monglife.discovery.domain.device.repository.AppVersionRepository;
import com.monglife.discovery.domain.device.vo.AppVersionVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AppVersionService {

    private final AppVersionRepository appVersionRepository;

    /**
     * 앱 버전 정보 조회
     * @param appPackageName 앱 패키지 명
     * @param buildVersion 빌드 버전
     * @return 앱 버전 정보 Vo
     */
    @Transactional(readOnly = true)
    public AppVersionVo getAppVersion(String appPackageName, String buildVersion) {

        AppVersionEntity appVersionEntity = appVersionRepository.findByAppPackageNameAndBuildVersion(appPackageName, buildVersion)
                .orElseThrow(() -> new NotExistsAppVersionException(appPackageName, buildVersion));

        return AppVersionVo.builder()
                .appVersionId(appVersionEntity.getAppVersionId())
                .appPackageName(appVersionEntity.getAppPackageName())
                .buildVersion(appVersionEntity.getBuildVersion())
                .mustUpdate(appVersionEntity.getMustUpdate())
                .build();
    }
}
