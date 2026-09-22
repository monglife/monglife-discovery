package com.monglife.discovery.app.common.admin.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AdminMaintenancePatchRequestDto {

    @NotNull
    private Boolean enabled;

    @Builder
    public AdminMaintenancePatchRequestDto(Boolean enabled) {
        this.enabled = enabled;
    }
}
