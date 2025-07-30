package com.monglife.discovery.app.gateway.dto.etc;

import com.monglife.module.common.logging.dto.LogDto;
import com.monglife.module.common.logging.enums.BasicLogType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthenticationLogDto extends LogDto {

    private String accessToken;

    @Builder
    public AuthenticationLogDto(String traceId, Integer traceOffset, String entryMethod, String className, String method, String accessToken) {
        super(traceId, traceOffset, entryMethod, className, method, BasicLogType.METHOD_CALL);
        this.accessToken = accessToken;
    }
}
