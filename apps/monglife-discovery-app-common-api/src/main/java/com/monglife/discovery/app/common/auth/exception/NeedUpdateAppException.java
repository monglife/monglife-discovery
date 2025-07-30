package com.monglife.discovery.app.common.auth.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.app.common.auth.enums.AuthErrorCode;
import lombok.Getter;

import java.util.Collections;

@Getter
public class NeedUpdateAppException extends ErrorException {

    public NeedUpdateAppException() {
        this.errorCode = AuthErrorCode.DISCOVERY_APP_AUTH_NEED_UPDATE_APP;
        this.result = Collections.emptyMap();
    }
}
