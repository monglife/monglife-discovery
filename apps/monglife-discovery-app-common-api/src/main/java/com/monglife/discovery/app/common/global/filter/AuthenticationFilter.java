package com.monglife.discovery.app.common.global.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.monglife.core.dto.response.ResponseDto;
import com.monglife.core.enums.response.GlobalResponse;
import com.monglife.core.vo.passport.PassportDataVo;
import com.monglife.core.vo.passport.PassportVo;
import com.monglife.discovery.app.common.auth.enums.AuthErrorCode;
import com.monglife.discovery.app.common.auth.service.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.GenericFilterBean;

import java.io.IOException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@AllArgsConstructor
public class AuthenticationFilter extends GenericFilterBean {

    private final ObjectMapper objectMapper;

    private final AuthService authService;

    /**
     * Header 에 담긴 Authorization 토큰 정보를 이용해 Passport Json 을 생성, Header 에 저장
     *
     * @param servletRequest The request to process
     * @param servletResponse The response associated with the request
     * @param chain          Provides access to the next filter in the chain for this filter to pass the request and response to for further processing
     */
    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        String accessToken = request.getHeader("Authorization");

        if (accessToken != null) {
            accessToken = accessToken.substring(6).trim();

            try {
                authService.verifyAccessToken(accessToken);

                PassportVo passportVo = PassportVo.builder()
                        .data(PassportDataVo.builder()
                                .account(authService.getPassportDataAccount(accessToken))
                                .appVersion(authService.getPassportDataAppVersion(accessToken))
                                .build())
                        .createdAt(LocalDateTime.now())
                        .build();

                MutableHttpServletRequest wrapperRequest = new MutableHttpServletRequest(request);
                wrapperRequest.addHeader("passport", URLEncoder.encode(objectMapper.writeValueAsString(passportVo), StandardCharsets.UTF_8));

                chain.doFilter(wrapperRequest, response);

            } catch (Exception e) {
                ResponseDto<?> responseDto = AuthErrorCode.DISCOVERY_APP_AUTH_ACCESS_TOKEN_EXPIRED.toResponseDto(HttpStatus.UNAUTHORIZED.value());
                response.setContentType("application/json; charset=UTF-8");
                response.setStatus(GlobalResponse.INTERNAL_SERVER_ERROR.getHttpStatus());
                response.getWriter().write(objectMapper.writeValueAsString(responseDto));
            }
        } else {
            chain.doFilter(request, response);
        }
    }

    /**
     * 헤더 추가를 위한 RequestWrapper 클래스
     */
    public static class MutableHttpServletRequest extends HttpServletRequestWrapper {

        private final Map<String, String> customHeaders = new HashMap<>();

        public MutableHttpServletRequest(HttpServletRequest request) {
            super(request);
        }

        // 새 헤더 추가
        public void addHeader(String name, String value) {
            customHeaders.put(name, value);
        }

        @Override
        public String getHeader(String name) {
            String headerValue = customHeaders.get(name);
            if (headerValue != null) {
                return headerValue;
            }
            return super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            Set<String> headerNames = new HashSet<>(customHeaders.keySet());
            Enumeration<String> originalHeaderNames = super.getHeaderNames();
            while (originalHeaderNames.hasMoreElements()) {
                headerNames.add(originalHeaderNames.nextElement());
            }
            return Collections.enumeration(headerNames);
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            if (customHeaders.containsKey(name)) {
                return Collections.enumeration(Collections.singletonList(customHeaders.get(name)));
            }
            return super.getHeaders(name);
        }
    }
}
