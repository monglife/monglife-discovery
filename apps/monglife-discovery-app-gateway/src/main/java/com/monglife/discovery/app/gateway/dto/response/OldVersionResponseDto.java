package com.monglife.discovery.app.gateway.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class OldVersionResponseDto {

    private String newestBuildVersion;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private LocalDateTime createdAt;

    private Boolean updateApp;

    private Boolean updateCode;

    @Builder
    public OldVersionResponseDto(String newestBuildVersion, LocalDateTime createdAt, Boolean updateApp, Boolean updateCode) {
        this.newestBuildVersion = newestBuildVersion;
        this.createdAt = createdAt;
        this.updateApp = updateApp;
        this.updateCode = updateCode;
    }
}