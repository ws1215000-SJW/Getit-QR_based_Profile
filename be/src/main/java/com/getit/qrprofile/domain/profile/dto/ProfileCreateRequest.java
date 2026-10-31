package com.getit.qrprofile.domain.profile.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/**
 * POST /profiles 요청.
 * id는 앱이 최초 실행 시 만든 UUID (QR에 들어가는 값, fe/src/lib/qrIdentity.ts)를 그대로 보낸다.
 */
public record ProfileCreateRequest(
        @NotNull UUID id,
        @NotBlank @Size(max = 30) String name,
        @NotNull @Min(1) @Max(150) Integer age,
        @NotBlank @Size(max = 50) String school,
        @NotBlank @Size(max = 50) String department,
        @Size(max = 50) String major,
        @Size(max = 20) String studentId,
        @Pattern(regexp = "^$|^[EIei][NSns][TFtf][JPjp]$", message = "MBTI 형식이 아닙니다") String mbti,
        @Size(max = 30) String instagram,
        @Size(max = 10) List<@NotBlank @Size(max = 30) String> clubs
) {
}
