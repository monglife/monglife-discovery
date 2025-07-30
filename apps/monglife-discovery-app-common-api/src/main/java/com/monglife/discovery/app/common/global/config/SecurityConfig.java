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
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

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
                .addFilterBefore(passportFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(authenticationFilter, PassportFilter.class)
                .addFilterBefore(globalExceptionFilter, AuthenticationFilter.class)
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/public/**").permitAll()
                        .requestMatchers("/admin/**").hasAuthority(RoleCode.ADMIN.getRole())
                        .requestMatchers("/**").hasAnyAuthority(RoleCode.ADMIN.getRole(), RoleCode.NORMAL.getRole())
                        .anyRequest().authenticated()
                )
                .exceptionHandling(configurer -> {
                    configurer.authenticationEntryPoint(unAuthorizationHandler);
                    configurer.accessDeniedHandler(forbiddenHandler);
                })
                .build();
    }

    @Bean
    public AuthenticationFilter authenticationFilter(@Autowired AuthService authService) {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        return new AuthenticationFilter(objectMapper, authService);
    }
}
