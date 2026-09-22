package com.monglife.discovery.app.common.admin.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.monglife.discovery.app.common.admin.dto.request.AdminMaintenanceSaveRequestDto;
import com.monglife.discovery.app.common.admin.dto.response.AdminMaintenanceResponseDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 점검 일정의 와이어 포맷.
 *
 * <p>시각을 시간대 없는 벽시계 문자열로 주고받는 것이 이 기능의 유일하게 새로운 계약이다.
 * 관리자 화면이 datetime-local 값을 그대로 보내고 서버가 LocalDateTime 으로 받는데,
 * 한쪽이라도 UTC 로 바꾸면 9시간 어긋난 시각에 점검이 걸린다. 눈에 띄지 않게 틀리는 종류라
 * 포맷을 테스트로 박아 둔다.
 */
@DisplayName("점검 일정 DTO 직렬화")
class AdminMaintenanceDtoTest {

    /** JavaTimeModule 만 올린 ObjectMapper. 애플리케이션의 LoggingObjectMapper 와 같은 조건이다 */
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Test
    @DisplayName("요청의 시각 문자열을 시간대 변환 없이 그대로 읽는다")
    void deserializeRequest() throws Exception {
        String json = "{\"message\":\"서버 점검 중입니다.\",\"startAt\":\"2026-09-21T02:00:00\",\"endAt\":\"2026-09-21T04:00:00\",\"enabled\":true}";

        AdminMaintenanceSaveRequestDto dto = objectMapper.readValue(json, AdminMaintenanceSaveRequestDto.class);

        assertThat(dto.getStartAt()).isEqualTo(LocalDateTime.of(2026, 9, 21, 2, 0));
        assertThat(dto.getEndAt()).isEqualTo(LocalDateTime.of(2026, 9, 21, 4, 0));
        assertThat(dto.getEnabled()).isTrue();
    }

    @Test
    @DisplayName("종료 미정이면 endAt 이 null")
    void deserializeRequest_openEnded() throws Exception {
        String json = "{\"message\":\"긴급 점검\",\"startAt\":\"2026-09-21T02:00:00\",\"endAt\":null,\"enabled\":true}";

        assertThat(objectMapper.readValue(json, AdminMaintenanceSaveRequestDto.class).getEndAt()).isNull();
    }

    @Test
    @DisplayName("모르는 필드가 와도 깨지지 않는다 (@JsonIgnoreProperties 가 없으면 400 이 아니라 500 이 난다)")
    void deserializeRequest_unknownField() throws Exception {
        String json = "{\"message\":\"점검\",\"startAt\":\"2026-09-21T02:00:00\",\"endAt\":null,\"enabled\":true,\"someNewField\":1}";

        assertThat(objectMapper.readValue(json, AdminMaintenanceSaveRequestDto.class).getMessage()).isEqualTo("점검");
    }

    @Test
    @DisplayName("응답의 시각은 배열이 아니라 ISO 문자열로 나간다")
    void serializeResponse() throws Exception {
        String json = objectMapper.writeValueAsString(AdminMaintenanceResponseDto.builder()
                .maintenanceId(1L)
                .message("서버 점검 중입니다.")
                .startAt(LocalDateTime.of(2026, 9, 21, 2, 0))
                .endAt(null)
                .enabled(true)
                .active(true)
                .createdAt(LocalDateTime.of(2026, 9, 20, 23, 30, 15))
                .updatedAt(LocalDateTime.of(2026, 9, 20, 23, 30, 15))
                .build());

        assertThat(json).contains("\"startAt\":\"2026-09-21T02:00:00\"");
        assertThat(json).contains("\"endAt\":null");
        assertThat(json).contains("\"createdAt\":\"2026-09-20T23:30:15\"");
        assertThat(json).contains("\"active\":true");
    }
}
