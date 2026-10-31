package com.getit.qrprofile.domain.savedprofile.repository;

import com.getit.qrprofile.domain.savedprofile.entity.SavedProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SavedProfileRepository extends JpaRepository<SavedProfile, Long> {

    boolean existsByOwnerIdAndTargetId(UUID ownerId, UUID targetId);

    @Query("SELECT s FROM SavedProfile s JOIN FETCH s.target WHERE s.id = :id AND s.owner.id = :ownerId")
    Optional<SavedProfile> findByIdAndOwnerIdWithTarget(@Param("id") Long id, @Param("ownerId") UUID ownerId);

    Optional<SavedProfile> findByIdAndOwnerId(Long id, UUID ownerId);

    @Query("SELECT s FROM SavedProfile s JOIN FETCH s.target t " +
            "WHERE s.owner.id = :ownerId " +
            "AND (:honorific IS NULL OR s.honorific = :honorific) " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "     t.name LIKE CONCAT('%', :keyword, '%') OR " +
            "     t.school LIKE CONCAT('%', :keyword, '%') OR " +
            "     t.department LIKE CONCAT('%', :keyword, '%')) " +
            "ORDER BY s.createdAt DESC")
    List<SavedProfile> searchSavedProfiles(
            @Param("ownerId") UUID ownerId,
            @Param("keyword") String keyword,
            @Param("honorific") Boolean honorific
    );
}