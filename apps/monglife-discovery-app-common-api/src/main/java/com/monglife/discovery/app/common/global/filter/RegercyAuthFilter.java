package com.monglife.discovery.app.common.global.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Order(Integer.MIN_VALUE)
@Component
public class RegercyAuthFilter implements Filter {

    /**
     * 이전 버전 AuthController 요청 RequestMapping 치환 필터
     */
    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) servletRequest;

        String originalContextPath = httpRequest.getContextPath();
        String originalServletPath = httpRequest.getServletPath();

        if (originalServletPath.startsWith("/auth") || originalServletPath.startsWith("/userDevice")) {
            filterChain.doFilter(new HttpServletRequestWrapper(httpRequest) {
                @Override
                public String getRequestURI() {
                    return originalContextPath + "/public" + originalServletPath;
                }

                @Override
                public String getServletPath() {
                    return "/public" + originalServletPath;
                }
            }, servletResponse);
        } else {
            filterChain.doFilter(servletRequest, servletResponse);
        }
    }
}
