package com.getit.qrprofile.domain.profile.entity;

import com.getit.qrprofile.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * profiles 테이블 (담당: 김수아)
 * - id: QR 안에 들어가는 UUID (getit:profile:{id}). 공개되는 값.
 * - ownerToken: 본인만 아는 비밀값. 프로필 수정·저장 요청 시 본인 확인용. 응답으로 절대 노출하지 않음.
 */
@Getter
@Entity
@Table(name = "profiles")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Profile extends BaseTimeEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "owner_token", nullable = false, unique = true, length = 64)
    private String ownerToken;

    // 필수
    @Column(nullable = false, length = 30)
    private String name;

    @Column(nullable = false)
    private Integer age;

    @Column(nullable = false, length = 50)
    private String school;

    @Column(nullable = false, length = 50)
    private String department;

    // 선택
    @Column(length = 50)
    private String major;           // TODO: 프론트 작성 화면에 넣을지 FE와 확정

    @Column(name = "student_id", length = 20)
    private String studentId;       // 예: "21학번"

    @Column(length = 4)
    private String mbti;

    @Column(length = 30)
    private String instagram;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]")
    private List<String> clubs = new ArrayList<>();

    @Column(name = "photo_url", length = 500)
    private String photoUrl;        // Supabase Storage 공개 URL

    @Builder
    private Profile(UUID id, String ownerToken, String name, Integer age, String school,
                    String department, String major, String studentId, String mbti,
                    String instagram, List<String> clubs, String photoUrl) {
        this.id = id;
        this.ownerToken = ownerToken;
        this.name = name;
        this.age = age;
        this.school = school;
        this.department = department;
        this.major = major;
        this.studentId = studentId;
        this.mbti = mbti;
        this.instagram = instagram;
        this.clubs = clubs != null ? clubs : new ArrayList<>();
        this.photoUrl = photoUrl;
    }

    /** 프로필 수정 (id, ownerToken은 바뀌지 않음) */
    public void update(String name, Integer age, String school, String department, String major,
                       String studentId, String mbti, String instagram, List<String> clubs) {
        this.name = name;
        this.age = age;
        this.school = school;
        this.department = department;
        this.major = major;
        this.studentId = studentId;
        this.mbti = mbti;
        this.instagram = instagram;
        this.clubs = clubs != null ? clubs : new ArrayList<>();
    }

    public void updatePhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }
}
