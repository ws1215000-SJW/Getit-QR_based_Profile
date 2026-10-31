package com.getit.qrprofile.domain.savedprofile.dto;

import com.getit.qrprofile.domain.profile.dto.ProfileResponse;
import com.getit.qrprofile.domain.profile.entity.Profile;
import com.getit.qrprofile.domain.savedprofile.entity.SavedProfile;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class SavedProfileResponse {

    @Getter
    public static class Simple {
        private Long savedProfileId;
        private UUID profileId;
        private String name;
        private Integer age;
        private String school;
        private String department;
        private String studentId;
        private String mbti;
        private String photoUrl;
        private boolean honorific;

        public Simple(SavedProfile savedProfile) {
            Profile target = savedProfile.getTarget();
            this.savedProfileId = savedProfile.getId();
            this.profileId = target.getId();
            this.name = target.getName();
            this.age = target.getAge();
            this.school = target.getSchool();
            this.department = target.getDepartment();
            this.studentId = target.getStudentId();
            this.mbti = target.getMbti();
            this.photoUrl = target.getPhotoUrl();
            this.honorific = savedProfile.isHonorific();
        }
    }

    @Getter
    public static class Detail {
        private Long savedProfileId;
        private TargetProfileDto profile;
        private boolean honorific;
        private String memo;

        public Detail(SavedProfile savedProfile) {
            this.savedProfileId = savedProfile.getId();
            this.profile = new TargetProfileDto(savedProfile.getTarget());
            this.honorific = savedProfile.isHonorific();
            this.memo = savedProfile.getMemo();
        }
    }

    @Getter
    public static class TargetProfileDto {
        private UUID profileId;
        private String name;
        private Integer age;
        private String school;
        private String department;
        private String major;
        private String studentId;
        private String mbti;
        private String instagram;
        private List<String> clubs;
        private String photoUrl;

        public TargetProfileDto(Profile profile) {
            this.profileId = profile.getId();
            this.name = profile.getName();
            this.age = profile.getAge();
            this.school = profile.getSchool();
            this.department = profile.getDepartment();
            this.major = profile.getMajor();
            this.studentId = profile.getStudentId();
            this.mbti = profile.getMbti();
            this.instagram = profile.getInstagram();
            this.clubs = profile.getClubs() != null ? List.copyOf(profile.getClubs()) : List.of();
            this.photoUrl = profile.getPhotoUrl();
        }
    }

    @Getter
    public static class UpdateResult {
        private Long savedProfileId;
        private boolean honorific;
        private String memo;
        private LocalDateTime updatedAt;

        public UpdateResult(SavedProfile savedProfile) {
            this.savedProfileId = savedProfile.getId();
            this.honorific = savedProfile.isHonorific();
            this.memo = savedProfile.getMemo();
            this.updatedAt = savedProfile.getUpdatedAt();
        }
    }
}