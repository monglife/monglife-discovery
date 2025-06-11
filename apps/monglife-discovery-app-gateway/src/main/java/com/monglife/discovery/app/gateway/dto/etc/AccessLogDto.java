package com.monglife.discovery.app.gateway.dto.etc;

import com.monglife.module.common.logging.dto.LogDto;
import com.monglife.module.common.logging.enums.BasicLogType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AccessLogDto extends LogDto {

    private String httpMethod;

    private String mapping;

    @Builder
    public AccessLogDto(String traceId, Integer traceOffset, String entryMethod, String className, String method, String httpMethod, String mapping) {
        super(traceId, traceOffset, entryMethod, className, method, BasicLogType.METHOD_CALL);
        this.httpMethod = httpMethod;
        this.mapping = mapping;
    }
}
