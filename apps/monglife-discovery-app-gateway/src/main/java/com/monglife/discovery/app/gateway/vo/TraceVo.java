package com.monglife.discovery.app.gateway.vo;

import lombok.Builder;
import lombok.Getter;

@Getter
public class TraceVo {

    private final String traceId;

    private final Integer traceOffset;

    @Builder
    public TraceVo(Integer traceOffset, String traceId) {
        this.traceOffset = traceOffset;
        this.traceId = traceId;
    }
}
