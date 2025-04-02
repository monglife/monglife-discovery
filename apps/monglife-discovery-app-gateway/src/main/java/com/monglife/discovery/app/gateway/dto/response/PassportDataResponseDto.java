package com.monglife.discovery.app.gateway.dto.response;

import com.monglife.core.vo.passport.PassportDataAccountVo;
import com.monglife.core.vo.passport.PassportDataAppVersionVo;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PassportDataResponseDto {

    private PassportDataAccountVo passportDataAccountVo;

    private PassportDataAppVersionVo passportDataAppVersionVo;

    @Builder
    public PassportDataResponseDto(PassportDataAccountVo passportDataAccountVo, PassportDataAppVersionVo passportDataAppVersionVo) {
        this.passportDataAccountVo = passportDataAccountVo;
        this.passportDataAppVersionVo = passportDataAppVersionVo;
    }
}
