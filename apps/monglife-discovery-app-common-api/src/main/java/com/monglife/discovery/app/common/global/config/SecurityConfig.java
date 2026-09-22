package com.monglife.discovery.app.common.global.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.monglife.core.enums.role.RoleCode;
import com.monglife.discovery.app.common.auth.service.AuthService;
import com.monglife.discovery.app.common.global.filter.AuthenticationFilter;
import com.monglife.module.common.security.exception.ForbiddenHandler;
import com.monglife.module.common.security.exception.UnAuthorizationHandler;
import com.monglife.module.common.security.filter.GlobalExceptionFilter;
import com.monglife.module.common.security.filter.PassportFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    /** 관리자 웹 출처. 콤마 구분 (@Value 는 리스트를 못 받는다) */
    @Value("${env.admin.allowed-origins}")
    private String adminAllowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(
            @Autowired UnAuthorizationHandler unAuthorizationHandler,
            @Autowired ForbiddenHandler forbiddenHandler,
            @Autowired PassportFilter passportFilter,
            @Autowired AuthenticationFilter authenticationFilter,
            @Autowired GlobalExceptionFilter globalExceptionFilter,
            HttpSecurity http
    ) throws Exception {

        return http
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .addFilterBefore(passportFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(authenticationFilter, PassportFilter.class)
                .addFilterBefore(globalExceptionFilter, AuthenticationFilter.class)
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/public/**").permitAll()
                        .requestMatchers("/admin/**").hasAuthority(RoleCode.ADMIN.getRole())
                        .requestMatchers("/**").hasAnyAuthority(RoleCode.ADMIN.getRole(), RoleCode.NORMAL.getRole())
                        .anyRequest().authenticated()
                )
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
                .exceptionHandling(configurer -> {
                    configurer.authenticationEntryPoint(unAuthorizationHandler);
                    configurer.accessDeniedHandler(forbiddenHandler);
                })
                .build();
    }

    /**
     * 관리자 웹(다른 출처)이 부르는 경로만 CORS 를 연다. 앱은 네이티브라 해당 없다.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(adminAllowedOrigins.split(","))
                .map(String::trim).filter(o -> !o.isEmpty()).toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setExposedHeaders(List.of("X-Total-Count"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/admin/**", config);
        source.registerCorsConfiguration("/public/admin/**", config);
        source.registerCorsConfiguration("/public/auth/logout", config);
        source.registerCorsConfiguration("/public/auth/reissue", config);
        return source;
    }

    @Bean
    public AuthenticationFilter authenticationFilter(@Autowired AuthService authService) {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        return new AuthenticationFilter(objectMapper, authService);
    }
}
