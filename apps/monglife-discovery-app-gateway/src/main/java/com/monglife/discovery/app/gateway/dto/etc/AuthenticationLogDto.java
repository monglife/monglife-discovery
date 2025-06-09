package com.monglife.discovery.app.gateway.dto.etc;

import com.monglife.core.utils.CommonUtil;
import com.monglife.module.common.logging.dto.LogDto;
import com.monglife.module.common.logging.enums.LogType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthenticationLogDto extends LogDto {

    private String accessToken;

    @Builder
    public AuthenticationLogDto(String entryMethod, String className, String method, String accessToken) {
        super(CommonUtil.randomId(), 0, entryMethod, className, method, LogType.METHOD_CALL);
        this.accessToken = accessToken;
    }
}
