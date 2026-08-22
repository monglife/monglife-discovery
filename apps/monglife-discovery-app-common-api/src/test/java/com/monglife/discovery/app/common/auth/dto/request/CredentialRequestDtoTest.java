package com.monglife.discovery.app.common.auth.dto.request;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * 클라이언트가 실제로 보내는 JSON 을 그대로 박아두고 역직렬화를 검증한다.
 * 로깅 모듈이 등록하는 ObjectMapper 때문에 운영에서 FAIL_ON_UNKNOWN_PROPERTIES 가
 * 켜진 채로 동작하므로, 필드가 하나라도 어긋나면 500 이 난다.
 */
@DisplayName("credential 요청 DTO 역직렬화 계약")
class CredentialRequestDtoTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("CredentialLoginRequestDto - 클라이언트 JSON 의 전 필드가 채워진다")
    void loginRequest() throws Exception {

        String json = """
                {
                  "deviceId": "device-1",
                  "email": "user@gmail.com",
                  "socialAccountId": "104729384756102938475",
                  "idToken": "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.sig",
                  "appPackageName": "com.mongs.mobile",
                  "deviceName": "Pixel 8",
                  "buildVersion": "1.0.0"
                }
                """;

        CredentialLoginRequestDto dto = objectMapper.readValue(json, CredentialLoginRequestDto.class);

        assertThat(dto.getDeviceId()).isEqualTo("device-1");
        assertThat(dto.getEmail()).isEqualTo("user@gmail.com");
        assertThat(dto.getSocialAccountId()).isEqualTo("104729384756102938475");
        assertThat(dto.getIdToken()).isEqualTo("eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.sig");
        assertThat(dto.getAppPackageName()).isEqualTo("com.mongs.mobile");
        assertThat(dto.getDeviceName()).isEqualTo("Pixel 8");
        assertThat(dto.getBuildVersion()).isEqualTo("1.0.0");
    }

    @Test
    @DisplayName("CredentialJoinRequestDto - 클라이언트 JSON 의 전 필드가 채워진다")
    void joinRequest() throws Exception {

        String json = """
                {
                  "email": "user@gmail.com",
                  "name": "몽이",
                  "socialAccountId": "104729384756102938475",
                  "idToken": "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.sig"
                }
                """;

        CredentialJoinRequestDto dto = objectMapper.readValue(json, CredentialJoinRequestDto.class);

        assertThat(dto.getEmail()).isEqualTo("user@gmail.com");
        assertThat(dto.getName()).isEqualTo("몽이");
        assertThat(dto.getSocialAccountId()).isEqualTo("104729384756102938475");
        assertThat(dto.getIdToken()).isEqualTo("eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.sig");
    }

    @Test
    @DisplayName("모르는 필드가 와도 500 이 나지 않는다 - @JsonIgnoreProperties")
    void ignoresUnknownFields() {

        String json = """
                {
                  "deviceId": "device-1",
                  "email": "user@gmail.com",
                  "socialAccountId": "104729384756102938475",
                  "idToken": "token",
                  "appPackageName": "com.mongs.mobile",
                  "deviceName": "Pixel 8",
                  "buildVersion": "1.0.0",
                  "somethingNewFromClient": "whatever"
                }
                """;

        assertThatCode(() -> objectMapper.readValue(json, CredentialLoginRequestDto.class))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("빌더가 전 필드를 받는다 - 기존 LoginRequestDto 의 누락 버그를 답습하지 않는다")
    void builderCoversAllFields() {

        CredentialLoginRequestDto dto = CredentialLoginRequestDto.builder()
                .deviceId("device-1")
                .email("user@gmail.com")
                .socialAccountId("sub")
                .idToken("token")
                .appPackageName("com.mongs.mobile")
                .deviceName("Pixel 8")
                .buildVersion("1.0.0")
                .build();

        assertThat(dto.getDeviceName()).isEqualTo("Pixel 8");
        assertThat(dto.getIdToken()).isEqualTo("token");
    }
}
