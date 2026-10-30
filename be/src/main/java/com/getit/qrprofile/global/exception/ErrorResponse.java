package com.getit.qrprofile.global.exception;

/** 모든 에러 응답 형식 통일: {"code": "...", "message": "..."} */
public record ErrorResponse(String code, String message) {
}
