package com.getit.qrprofile.domain.savedprofile.repository;

import com.getit.qrprofile.domain.savedprofile.entity.SavedProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SavedProfileRepository extends JpaRepository<SavedProfile, Long> {

    List<SavedProfile> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    boolean existsByOwnerIdAndTargetId(UUID ownerId, UUID targetId);

    Optional<SavedProfile> findByIdAndOwnerId(Long id, UUID ownerId);

    // TODO(오지수): 이름 검색, 존댓말 필터 등 필요한 조회 메서드 추가
}
