package com.getit.qrprofile.domain.savedprofile.service;

import com.getit.qrprofile.domain.profile.entity.Profile;
import com.getit.qrprofile.domain.profile.service.ProfileService;
import com.getit.qrprofile.domain.profile.repository.ProfileRepository;
import com.getit.qrprofile.domain.savedprofile.dto.SavedProfileRequest;
import com.getit.qrprofile.domain.savedprofile.dto.SavedProfileResponse;
import com.getit.qrprofile.domain.savedprofile.entity.SavedProfile;
import com.getit.qrprofile.domain.savedprofile.repository.SavedProfileRepository;
import com.getit.qrprofile.global.exception.CustomException;
import com.getit.qrprofile.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SavedProfileService {

    private final SavedProfileRepository savedProfileRepository;
    private final ProfileRepository profileRepository;
    private final ProfileService profileService;

    // 1. 상대방 프로필 저장 (QR)
    @Transactional
    public Long saveProfile(String ownerToken, SavedProfileRequest.Save request) {
        Profile owner = profileService.getByOwnerToken(ownerToken);
        Profile target = profileRepository.findById(request.getTargetProfileId())
                .orElseThrow(() -> new CustomException(ErrorCode.PROFILE_NOT_FOUND));

        if (owner.getId().equals(target.getId())) {
            throw new CustomException(ErrorCode.CANNOT_SAVE_SELF);
        }

        if (savedProfileRepository.existsByOwnerIdAndTargetId(owner.getId(), target.getId())) {
            throw new CustomException(ErrorCode.ALREADY_SAVED);
        }

        SavedProfile savedProfile = SavedProfile.builder()
                .owner(owner)
                .target(target)
                .build();

        return savedProfileRepository.save(savedProfile).getId();
    }

    // 2. 저장 목록 조회 및 검색, 필터링
    public List<SavedProfileResponse.Simple> getSavedProfiles(String ownerToken, String search, Boolean honorific) {
        Profile owner = profileService.getByOwnerToken(ownerToken);
        String keyword = (search == null) ? "" : search.trim(); // 빈 문자열이면 LIKE '%%' → 전체 조회
        return savedProfileRepository.searchSavedProfiles(owner.getId(), keyword, honorific).stream()
                .map(SavedProfileResponse.Simple::new)
                .toList();
    }

    // 3. 상대 세부 정보 조회
    public SavedProfileResponse.Detail getSavedProfileDetail(String ownerToken, Long id) {
        Profile owner = profileService.getByOwnerToken(ownerToken);
        SavedProfile savedProfile = savedProfileRepository.findByIdAndOwnerIdWithTarget(id, owner.getId())
                .orElseThrow(() -> new CustomException(ErrorCode.SAVED_PROFILE_NOT_FOUND));

        return new SavedProfileResponse.Detail(savedProfile);
    }

    // 4. 존댓말 설정 및 메모 수정
    @Transactional
    public SavedProfileResponse.UpdateResult updateSavedProfile(
            String ownerToken, Long id, SavedProfileRequest.Update request) {
        Profile owner = profileService.getByOwnerToken(ownerToken);
        SavedProfile savedProfile = savedProfileRepository.findByIdAndOwnerId(id, owner.getId())
                .orElseThrow(() -> new CustomException(ErrorCode.SAVED_PROFILE_NOT_FOUND));

        if (request.getHonorific() != null) {
            savedProfile.updateHonorific(request.getHonorific());
        }
        if (request.getMemo() != null) {
            savedProfile.updateMemo(request.getMemo());
        }
        savedProfileRepository.flush();
        return new SavedProfileResponse.UpdateResult(savedProfile);
    }
}
