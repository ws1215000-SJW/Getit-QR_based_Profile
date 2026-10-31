package com.getit.qrprofile.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/** 에러 종류는 여기에 추가. 오지수 님 API 명세서의 에러 코드와 맞춰서 정리할 것 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 공통
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "본인 확인 토큰이 없거나 올바르지 않습니다."),

    // 프로필 (김수아)
    PROFILE_NOT_FOUND(HttpStatus.NOT_FOUND, "프로필을 찾을 수 없습니다."),
    PROFILE_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 생성된 프로필입니다."),
    INVALID_FILE(HttpStatus.BAD_REQUEST, "jpg, png, webp, heic 이미지 파일만 올릴 수 있습니다."),
    FILE_TOO_LARGE(HttpStatus.BAD_REQUEST, "사진은 5MB 이하만 올릴 수 있습니다."),
    STORAGE_ERROR(HttpStatus.BAD_GATEWAY, "사진 저장소 처리 중 오류가 발생했습니다."),

    // 저장 관계 (오지수)
    SAVED_PROFILE_NOT_FOUND(HttpStatus.NOT_FOUND, "저장된 프로필을 찾을 수 없습니다."),
    ALREADY_SAVED(HttpStatus.CONFLICT, "이미 저장한 프로필입니다."),
    CANNOT_SAVE_SELF(HttpStatus.BAD_REQUEST, "자기 자신은 저장할 수 없습니다.");

    private final HttpStatus status;
    private final String message;
}
