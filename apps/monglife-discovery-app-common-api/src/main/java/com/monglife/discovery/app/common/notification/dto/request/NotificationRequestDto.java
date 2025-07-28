package com.monglife.discovery.app.common.notification.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class NotificationRequestDto {

    @NotNull
    private Long accountId;

    @NotBlank
    private String title;

    @NotBlank
    private String body;

    @Builder
    public NotificationRequestDto(Long accountId, String title, String body) {
        this.accountId = accountId;
        this.title = title;
        this.body = body;
    }
}
