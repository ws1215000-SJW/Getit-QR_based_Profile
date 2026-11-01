package com.getit.qrprofile.domain.savedprofile.controller;

import com.getit.qrprofile.domain.profile.controller.ProfileController;
import com.getit.qrprofile.domain.savedprofile.dto.SavedProfileRequest;
import com.getit.qrprofile.domain.savedprofile.dto.SavedProfileResponse;
import com.getit.qrprofile.domain.savedprofile.service.SavedProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/saved-profiles")
@RequiredArgsConstructor
public class SavedProfileController {

    private final SavedProfileService savedProfileService;

    // 1. 상대방 프로필 저장
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> saveProfile(
            @RequestHeader(value = ProfileController.OWNER_TOKEN_HEADER, required = false) String ownerToken,
            @Valid @RequestBody SavedProfileRequest.Save request) {
        Long savedProfileId = savedProfileService.saveProfile(ownerToken, request);
        return Map.of("savedProfileId", savedProfileId, "message", "저장 완료");
    }

    // 2. 저장 목록 조회 및 검색, 필터링
    @GetMapping
    public List<SavedProfileResponse.Simple> getSavedProfiles(
            @RequestHeader(value = ProfileController.OWNER_TOKEN_HEADER, required = false) String ownerToken,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "honorific", required = false) Boolean honorific) {
        return savedProfileService.getSavedProfiles(ownerToken, search, honorific);
    }

    // 3. 상대 세부 정보 조회
    @GetMapping("/{id}")
    public SavedProfileResponse.Detail getSavedProfileDetail(
            @RequestHeader(value = ProfileController.OWNER_TOKEN_HEADER, required = false) String ownerToken,
            @PathVariable Long id) {
        return savedProfileService.getSavedProfileDetail(ownerToken, id);
    }

    // 4. 존댓말 설정 및 메모 수정
    @PatchMapping("/{id}")
    public SavedProfileResponse.UpdateResult updateSavedProfile(
            @RequestHeader(value = ProfileController.OWNER_TOKEN_HEADER, required = false) String ownerToken,
            @PathVariable Long id,
            @Valid @RequestBody SavedProfileRequest.Update request) {
        return savedProfileService.updateSavedProfile(ownerToken, id, request);
    }
}