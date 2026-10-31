package com.getit.qrprofile.domain.profile.service;

import com.getit.qrprofile.domain.profile.dto.ProfileCreateRequest;
import com.getit.qrprofile.domain.profile.dto.ProfileCreateResponse;
import com.getit.qrprofile.domain.profile.dto.ProfileResponse;
import com.getit.qrprofile.domain.profile.dto.ProfileUpdateRequest;
import com.getit.qrprofile.domain.profile.entity.Profile;
import com.getit.qrprofile.domain.profile.repository.ProfileRepository;
import com.getit.qrprofile.global.exception.CustomException;
import com.getit.qrprofile.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfileService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final ProfileRepository profileRepository;

    /** 프로필 생성 + ownerToken 발급 */
    @Transactional
    public ProfileCreateResponse create(ProfileCreateRequest req) {
        if (profileRepository.existsById(req.id())) {
            throw new CustomException(ErrorCode.PROFILE_ALREADY_EXISTS);
        }

        String token = generateToken();
        Profile profile = Profile.builder()
                .id(req.id())
                .ownerToken(token)
                .name(req.name().trim())
                .age(req.age())
                .school(req.school().trim())
                .department(req.department().trim())
                .major(blankToNull(req.major()))
                .studentId(blankToNull(req.studentId()))
                .mbti(normalizeMbti(req.mbti()))
                .instagram(normalizeInstagram(req.instagram()))
                .clubs(cleanClubs(req.clubs()))
                .build();

        Profile saved = profileRepository.saveAndFlush(profile);
        return new ProfileCreateResponse(ProfileResponse.from(saved), token);
    }

    /** QR 스캔 후 상대 프로필 조회 (토큰 불필요) */
    public ProfileResponse getById(UUID id) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.PROFILE_NOT_FOUND));
        return ProfileResponse.from(profile);
    }

    /** 내 프로필 조회 */
    public ProfileResponse getMe(String ownerToken) {
        return ProfileResponse.from(getByOwnerToken(ownerToken));
    }

    /** 내 프로필 수정 */
    @Transactional
    public ProfileResponse updateMe(String ownerToken, ProfileUpdateRequest req) {
        Profile profile = getByOwnerToken(ownerToken);
        profile.update(
                req.name().trim(),
                req.age(),
                req.school().trim(),
                req.department().trim(),
                blankToNull(req.major()),
                blankToNull(req.studentId()),
                normalizeMbti(req.mbti()),
                normalizeInstagram(req.instagram()),
                cleanClubs(req.clubs())
        );
        profileRepository.flush(); // updatedAt 반영
        return ProfileResponse.from(profile);
    }

    /**
     * X-Owner-Token 헤더로 "나"를 찾는다. 토큰이 없거나 틀리면 401.
     * 오지수 님 SavedProfileService에서도 이 메서드를 쓰면 됨.
     */
    public Profile getByOwnerToken(String ownerToken) {
        if (ownerToken == null || ownerToken.isBlank()) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        return profileRepository.findByOwnerToken(ownerToken)
                .orElseThrow(() -> new CustomException(ErrorCode.UNAUTHORIZED));
    }

    // ───── 내부 도우미 ─────

    /** 32바이트 난수 → URL에 안전한 43자 문자열 */
    private static String generateToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private static String normalizeMbti(String mbti) {
        String v = blankToNull(mbti);
        return v == null ? null : v.toUpperCase();
    }

    /** "@seoyeon.zip", "seoyeon.zip" 둘 다 "seoyeon.zip"으로 저장 */
    private static String normalizeInstagram(String instagram) {
        String v = blankToNull(instagram);
        if (v == null) return null;
        return v.startsWith("@") ? blankToNull(v.substring(1)) : v;
    }

    private static List<String> cleanClubs(List<String> clubs) {
        if (clubs == null) return List.of();
        return clubs.stream()
                .map(String::trim)
                .filter(c -> !c.isEmpty())
                .distinct()
                .toList();
    }
}
