package com.monglife.discovery.domain.account.service;

import com.monglife.discovery.domain.account.entity.AccountEntity;
import com.monglife.discovery.domain.account.exception.AlreadyExistsAccountException;
import com.monglife.discovery.domain.account.exception.NotExistsAccountException;
import com.monglife.discovery.domain.account.repository.AccountRepository;
import com.monglife.discovery.domain.account.vo.AccountVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;

    /**
     * 계정 생성
     * @param accountVo 계정 생성 정보 Vo
     */
    @Transactional
    public void createAccount(AccountVo accountVo) {

        accountRepository.findByEmail(accountVo.getEmail())
                .ifPresent(accountEntity -> { throw new AlreadyExistsAccountException(); });

        AccountEntity accountEntity = AccountEntity.builder()
                .email(accountVo.getEmail())
                .name(accountVo.getName())
                .socialAccountId(accountVo.getSocialAccountId())
                .role(accountVo.getRole())
                .build();

        accountRepository.save(accountEntity);
    }

    /**
     * 이메일 기준 계정 정보 조회
     * @param email 이메일
     * @return 계정 정보 Vo
     */
    @Transactional(readOnly = true)
    public AccountVo getAccount(String email) {

        AccountEntity accountEntity = accountRepository.findByEmail(email)
                .orElseThrow(NotExistsAccountException::new);

        return AccountVo.builder()
                .accountId(accountEntity.getAccountId())
                .email(accountEntity.getEmail())
                .name(accountEntity.getName())
                .socialAccountId(accountEntity.getSocialAccountId())
                .role(accountEntity.getRole())
                .build();
    }

    /**
     * 계정 ID 기준 계정 정보 조회
     * @param accountId 계정 ID
     * @return 계정 정보 Vo
     */
    @Transactional(readOnly = true)
    public AccountVo getAccount(Long accountId) {

        AccountEntity accountEntity = accountRepository.findByAccountId(accountId)
                .orElseThrow(NotExistsAccountException::new);

        return AccountVo.builder()
                .email(accountEntity.getEmail())
                .name(accountEntity.getName())
                .socialAccountId(accountEntity.getSocialAccountId())
                .role(accountEntity.getRole())
                .build();
    }

    /**
     * 구글 계정 ID 업데이트
     * @param email 이메일
     * @param socialAccountId 구글 계정 ID
     */
    @Transactional
    public void updateSocialAccountId(String email, String socialAccountId) {

        AccountEntity accountEntity = accountRepository.findBySocialAccountId(email)
                .orElseThrow(NotExistsAccountException::new);

        accountEntity.updateSocialAccountId(socialAccountId);
    }
}
