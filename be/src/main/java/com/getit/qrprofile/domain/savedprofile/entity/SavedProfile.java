package com.getit.qrprofile.domain.savedprofile.entity;

import com.getit.qrprofile.domain.profile.entity.Profile;
import com.getit.qrprofile.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * saved_profiles 테이블 (스키마: 김수아 / API: 오지수)
 * "owner가 QR로 target을 저장했다"는 관계 한 줄.
 * 상대 정보는 복사하지 않고 target_id로 참조 → 상대가 프로필을 고치면 목록에도 최신 정보가 보임.
 */
@Getter
@Entity
@Table(
        name = "saved_profiles",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_saved_owner_target",
                columnNames = {"owner_id", "target_id"}   // 같은 사람 중복 저장 방지
        )
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SavedProfile extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 저장한 사람 (나) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Profile owner;

    /** 저장된 사람 (QR 찍힌 상대) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "target_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Profile target;

    /** 존댓말 사용 여부 */
    @Column(nullable = false)
    private boolean honorific = false;

    /** 나만 보는 메모 (프론트 200자 제한과 동일) */
    @Column(length = 200)
    private String memo = "";

    @Builder
    private SavedProfile(Profile owner, Profile target) {
        this.owner = owner;
        this.target = target;
    }

    public void updateHonorific(boolean honorific) {
        this.honorific = honorific;
    }

    public void updateMemo(String memo) {
        this.memo = memo != null ? memo : "";
    }
}
