package com.monglife.discovery.app.common.auth.exception;

import com.monglife.core.exception.ErrorException;
import com.monglife.discovery.app.common.auth.enums.AuthErrorCode;
import com.monglife.discovery.app.common.auth.enums.AuthResponse;
import lombok.Getter;

import java.util.Collections;

@Getter
public class NeedAppUpdateException extends ErrorException {

    public NeedAppUpdateException() {
        this.errorCode = AuthErrorCode.DISCOVERY_APP_AUTH_NEED_UPDATE_APP_VERSION;
        this.result = Collections.emptyMap();
    }
}
