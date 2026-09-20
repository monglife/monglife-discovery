package com.monglife.discovery.app.common.admin.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 점검 일정 등록·수정 요청.
 *
 * <p>등록과 수정이 받는 필드가 같아서 하나로 쓴다. 나중에 갈릴 일이 생기면 그때 나눈다.
 *
 * <p>시각은 <b>서버 시간대(Asia/Seoul)의 벽시계 문자열</b>이다({@code 2026-09-21T02:00:00}).
 * 관리자 화면의 {@code datetime-local} 값이 그대로 오고, 여기서 {@code LocalDateTime} 으로 받는다.
 * UTC 로 변환해 보내면 9시간 어긋난다.
 */
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AdminMaintenanceSaveRequestDto {

    @NotBlank @Size(max = 200)
    private String message;

    @NotNull
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startAt;

    /** 비우면 종료 미정 */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime endAt;

    @NotNull
    private Boolean enabled;

    @Builder
    public AdminMaintenanceSaveRequestDto(String message, LocalDateTime startAt, LocalDateTime endAt, Boolean enabled) {
        this.message = message;
        this.startAt = startAt;
        this.endAt = endAt;
        this.enabled = enabled;
    }
}
