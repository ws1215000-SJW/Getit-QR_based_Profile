package com.getit.qrprofile.domain.profile.repository;

import com.getit.qrprofile.domain.profile.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProfileRepository extends JpaRepository<Profile, UUID> {

    /** 요청 헤더의 토큰으로 "나"를 찾을 때 사용 (오지수 님 API에서도 사용) */
    Optional<Profile> findByOwnerToken(String ownerToken);
}
