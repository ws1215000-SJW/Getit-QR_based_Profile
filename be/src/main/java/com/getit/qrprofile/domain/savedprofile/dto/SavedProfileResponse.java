package com.getit.qrprofile.domain.savedprofile.dto;

import com.getit.qrprofile.domain.profile.dto.ProfileResponse;
import com.getit.qrprofile.domain.profile.entity.Profile;
import com.getit.qrprofile.domain.savedprofile.entity.SavedProfile;
import lombok.Getter;

import java.time.LocalDateTime;
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
        private ProfileResponse profile;
        private boolean honorific;
        private String memo;

        public Detail(SavedProfile savedProfile) {
            this.savedProfileId = savedProfile.getId();
            this.profile = ProfileResponse.from(savedProfile.getTarget());
            this.honorific = savedProfile.isHonorific();
            this.memo = savedProfile.getMemo();
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