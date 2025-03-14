package com.monglife.discovery.domain.account.service;

import com.monglife.discovery.domain.account.entity.TokenEntity;
import com.monglife.discovery.domain.account.exception.NotExistsTokenException;
import com.monglife.discovery.domain.account.repository.TokenRepository;
import com.monglife.discovery.domain.account.vo.TokenVo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenService {

    private final TokenRepository tokenRepository;

    /**
     * 토큰 등록
     * @param tokenVo 토큰 정보 Vo
     */
    @Transactional
    public void createToken(TokenVo tokenVo) {
        tokenRepository.save(TokenEntity.builder()
                .refreshToken(tokenVo.getRefreshToken())
                .deviceId(tokenVo.getDeviceId())
                .accountId(tokenVo.getAccountId())
                .appPackageName(tokenVo.getAppPackageName())
                .buildVersion(tokenVo.getBuildVersion())
                .createdAt(tokenVo.getCreatedAt())
                .expiration(tokenVo.getExpiration())
                .build());
    }

    /**
     * 토큰 정보 삭제
     * @param accountId 계정 ID
     * @param deviceId 기기 ID
     */
    @Transactional
    public void deleteToken(Long accountId, String deviceId) {
        tokenRepository.findByDeviceIdAndAccountId(deviceId, accountId)
                .ifPresent(tokenEntity -> tokenRepository.deleteById(tokenEntity.getRefreshToken()));
    }

    /**
     * 토큰 정보 삭제
     * @param refreshToken RefreshToken
     */
    @Transactional
    public TokenVo deleteToken(String refreshToken) {

        TokenEntity tokenEntity = tokenRepository.findById(refreshToken)
                .orElseThrow(() -> new NotExistsTokenException(refreshToken));

        tokenRepository.deleteById(tokenEntity.getRefreshToken());

        return TokenVo.builder()
                .refreshToken(tokenEntity.getRefreshToken())
                .deviceId(tokenEntity.getDeviceId())
                .accountId(tokenEntity.getAccountId())
                .appPackageName(tokenEntity.getAppPackageName())
                .buildVersion(tokenEntity.getBuildVersion())
                .createdAt(tokenEntity.getCreatedAt())
                .expiration(tokenEntity.getExpiration())
                .build();
    }
}
