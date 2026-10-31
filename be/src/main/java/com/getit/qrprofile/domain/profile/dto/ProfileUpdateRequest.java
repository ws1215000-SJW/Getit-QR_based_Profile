package com.getit.qrprofile.domain.profile.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/** PUT /profiles/me 요청. 전체 덮어쓰기 (보내지 않은 선택 항목은 비워짐). id·사진은 바꾸지 않음 */
public record ProfileUpdateRequest(
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
