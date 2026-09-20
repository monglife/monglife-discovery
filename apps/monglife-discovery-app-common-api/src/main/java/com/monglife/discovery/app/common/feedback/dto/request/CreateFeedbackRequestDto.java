package com.monglife.discovery.app.common.feedback.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * monglife-mongs 의 CreateFeedbackRequestDto 와 필드가 같다 (앱이 그대로 보낸다).
 * 앱 패키지·버전은 본문이 아니라 토큰에서 채운다.
 */
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateFeedbackRequestDto {

    @NotBlank
    @Size(max = 255)
    private String deviceName;

    @NotBlank
    @Size(max = 255)
    private String title;

    @NotNull
    @Size(max = 5000)
    private String content;

    /**
     * 앱이 붙인 진단 로그(logcat 조각). 없을 수 있다 - 못 모았다고 신고를 막지 않는다.
     *
     * <p>앱에서 이미 마지막 300줄로 자르고 토큰을 가려서 보낸다. 상한을 여기서 한 번 더
     * 두는 것은 앱을 믿지 않기 위해서다 - 이 엔드포인트는 공개 경로라 아무나 부를 수 있다.
     */
    @Size(max = 16000)
    private String logs;

    @Builder
    public CreateFeedbackRequestDto(String deviceName, String title, String content, String logs) {
        this.deviceName = deviceName;
        this.title = title;
        this.content = content;
        this.logs = logs;
    }
}
