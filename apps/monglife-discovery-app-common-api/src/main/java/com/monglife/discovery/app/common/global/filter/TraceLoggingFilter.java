package com.monglife.discovery.app.common.global.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
public class TraceLoggingFilter implements Filter {

    /**
     * Trace Logging ID 추출 필터
     */
    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) servletRequest;

        String traceId = httpRequest.getHeader("X-Trace-Id");

        if (traceId != null && !traceId.isBlank()) {
            MDC.put("traceId", traceId);
        }

        filterChain.doFilter(servletRequest, servletResponse);
    }
}
