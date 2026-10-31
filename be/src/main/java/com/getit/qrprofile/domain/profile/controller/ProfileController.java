package com.getit.qrprofile.domain.profile.controller;

import com.getit.qrprofile.domain.profile.dto.ProfileCreateRequest;
import com.getit.qrprofile.domain.profile.dto.ProfileCreateResponse;
import com.getit.qrprofile.domain.profile.dto.ProfileResponse;
import com.getit.qrprofile.domain.profile.dto.ProfileUpdateRequest;
import com.getit.qrprofile.domain.profile.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/profiles")
@RequiredArgsConstructor
public class ProfileController {

    public static final String OWNER_TOKEN_HEADER = "X-Owner-Token";

    private final ProfileService profileService;

    /** 프로필 생성 (최초 1회) → ownerToken 발급 */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProfileCreateResponse create(@Valid @RequestBody ProfileCreateRequest request) {
        return profileService.create(request);
    }

    /** 내 프로필 조회 */
    @GetMapping("/me")
    public ProfileResponse getMe(
            @RequestHeader(value = OWNER_TOKEN_HEADER, required = false) String ownerToken) {
        return profileService.getMe(ownerToken);
    }

    /** 내 프로필 수정 */
    @PutMapping("/me")
    public ProfileResponse updateMe(
            @RequestHeader(value = OWNER_TOKEN_HEADER, required = false) String ownerToken,
            @Valid @RequestBody ProfileUpdateRequest request) {
        return profileService.updateMe(ownerToken, request);
    }

    /** QR 스캔 후 상대 프로필 조회 (토큰 불필요) */
    @GetMapping("/{id}")
    public ProfileResponse getById(@PathVariable UUID id) {
        return profileService.getById(id);
    }
}
