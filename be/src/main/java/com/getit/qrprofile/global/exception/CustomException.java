package com.getit.qrprofile.global.exception;

import lombok.Getter;

/** 서비스에서 throw new CustomException(ErrorCode.PROFILE_NOT_FOUND) 처럼 사용 */
@Getter
public class CustomException extends RuntimeException {

    private final ErrorCode errorCode;

    public CustomException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
