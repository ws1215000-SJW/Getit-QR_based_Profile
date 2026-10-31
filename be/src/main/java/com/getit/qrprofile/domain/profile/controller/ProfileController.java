package com.getit.qrprofile.domain.profile.controller;

import com.getit.qrprofile.domain.profile.dto.PhotoResponse;
import com.getit.qrprofile.domain.profile.dto.ProfileCreateRequest;
import com.getit.qrprofile.domain.profile.dto.ProfileCreateResponse;
import com.getit.qrprofile.domain.profile.dto.ProfileResponse;
import com.getit.qrprofile.domain.profile.dto.ProfileUpdateRequest;
import com.getit.qrprofile.domain.profile.service.ProfilePhotoService;
import com.getit.qrprofile.domain.profile.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/profiles")
@RequiredArgsConstructor
public class ProfileController {

    public static final String OWNER_TOKEN_HEADER = "X-Owner-Token";

    private final ProfileService profileService;
    private final ProfilePhotoService profilePhotoService;

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

    /** 프로필 사진 업로드 (multipart/form-data, 필드 이름: file) */
    @PostMapping(value = "/me/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PhotoResponse uploadPhoto(
            @RequestHeader(value = OWNER_TOKEN_HEADER, required = false) String ownerToken,
            @RequestPart("file") MultipartFile file) {
        return profilePhotoService.upload(ownerToken, file);
    }

    /** 프로필 사진 삭제 */
    @DeleteMapping("/me/photo")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePhoto(
            @RequestHeader(value = OWNER_TOKEN_HEADER, required = false) String ownerToken) {
        profilePhotoService.delete(ownerToken);
    }

    /** QR 스캔 후 상대 프로필 조회 (토큰 불필요) */
    @GetMapping("/{id}")
    public ProfileResponse getById(@PathVariable UUID id) {
        return profileService.getById(id);
    }
}
