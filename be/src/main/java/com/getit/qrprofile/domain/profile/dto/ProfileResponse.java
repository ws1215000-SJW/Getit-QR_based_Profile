package com.getit.qrprofile.domain.profile.dto;

import com.getit.qrprofile.domain.profile.entity.Profile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 프로필 응답 (ownerToken 없음 → 남에게 보여줘도 안전).
 * 오지수 님 GET /saved-profiles/{id} 응답의 "profile" 자리에도 그대로 사용 가능: ProfileResponse.from(saved.getTarget())
 */
public record ProfileResponse(
        UUID id,
        String name,
        Integer age,
        String school,
        String department,
        String major,
        String studentId,
        String mbti,
        String instagram,
        List<String> clubs,
        String photoUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ProfileResponse from(Profile p) {
        return new ProfileResponse(
                p.getId(), p.getName(), p.getAge(), p.getSchool(), p.getDepartment(),
                p.getMajor(), p.getStudentId(), p.getMbti(), p.getInstagram(),
                p.getClubs() != null ? List.copyOf(p.getClubs()) : List.of(),
                p.getPhotoUrl(), p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
