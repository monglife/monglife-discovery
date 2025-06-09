package com.monglife.discovery.app.gateway.dto.etc;

import com.monglife.core.utils.CommonUtil;
import com.monglife.module.common.logging.dto.LogDto;
import com.monglife.module.common.logging.enums.LogType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GeneratePassportLogDto extends LogDto {

    private Long accountId;

    private String appPackageName;

    private String buildVersion;

    @Builder
    public GeneratePassportLogDto(String entryMethod, String className, String method, Long accountId, String appPackageName, String buildVersion) {
        super(CommonUtil.randomId(), 0, entryMethod, className, method, LogType.METHOD_CALL);
        this.accountId = accountId;
        this.appPackageName = appPackageName;
        this.buildVersion = buildVersion;
    }
}
