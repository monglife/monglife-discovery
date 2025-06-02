package com.monglife.discovery.app.common.global.provider;

import com.monglife.discovery.app.common.global.utils.JwtTokenUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class TokenProvider {

    @Value("${env.jwt.secret-key}")
    private String JWT_KEY;

    @Value("${env.jwt.access-expiration}")
    private Long ACCESS_TOKEN_EXPIRED;

    @Value("${env.jwt.refresh-expiration}")
    private Long REFRESH_TOKEN_EXPIRED;

    public Long getRefreshTokenExpiration() {
        return REFRESH_TOKEN_EXPIRED;
    }

    public Boolean isTokenExpired(String token) {

        try {
            Date expiration = JwtTokenUtil.extractAllClaims(JWT_KEY, token).getExpiration();
            return expiration.before(new Date());
        } catch (ExpiredJwtException | SignatureException | IllegalArgumentException | MalformedJwtException e) {
            return true;
        }
    }

    public String generateAccessToken(Long accountId, String deviceId, String appPackageName, String buildVersion) {

        Claims claims = Jwts.claims();
        claims.put("accountId", accountId);
        claims.put("deviceId", deviceId);
        claims.put("appPackageName", appPackageName);
        claims.put("buildVersion", buildVersion);

        return JwtTokenUtil.generateToken(JWT_KEY, claims, ACCESS_TOKEN_EXPIRED);
    }

    public String generateRefreshToken() {

        Claims claims = Jwts.claims();

        return JwtTokenUtil.generateToken(JWT_KEY, claims, REFRESH_TOKEN_EXPIRED);
    }

    public Optional<Long> getAccountId(String token) {

        if (isTokenExpired(token)) {
            return Optional.empty();
        }

        return Optional.ofNullable(JwtTokenUtil.extractAllClaims(JWT_KEY, token).get("accountId", Long.class));
    }

    public Optional<String> getDeviceId(String token) {

        if (isTokenExpired(token)) {
            return Optional.empty();
        }

        return Optional.ofNullable(JwtTokenUtil.extractAllClaims(JWT_KEY, token).get("deviceId", String.class));
    }

    public Optional<String> getAppPackageName(String token) {

        if (isTokenExpired(token)) {
            return Optional.empty();
        }

        return Optional.ofNullable(JwtTokenUtil.extractAllClaims(JWT_KEY, token).get("appPackageName", String.class));
    }

    public Optional<String> getBuildVersion(String token) {

        if (isTokenExpired(token)) {
            return Optional.empty();
        }

        return Optional.ofNullable(JwtTokenUtil.extractAllClaims(JWT_KEY, token).get("buildVersion", String.class));
    }
}