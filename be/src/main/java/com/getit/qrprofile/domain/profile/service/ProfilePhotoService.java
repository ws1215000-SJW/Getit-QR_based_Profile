package com.getit.qrprofile.domain.profile.service;

import com.getit.qrprofile.domain.profile.dto.PhotoResponse;
import com.getit.qrprofile.domain.profile.entity.Profile;
import com.getit.qrprofile.global.exception.CustomException;
import com.getit.qrprofile.global.exception.ErrorCode;
import com.getit.qrprofile.global.storage.SupabaseStorageClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfilePhotoService {

    private static final long MAX_BYTES = 5L * 1024 * 1024;

    /** 허용하는 이미지 형식 → 저장할 확장자 */
    private static final Map<String, String> ALLOWED_TYPES = Map.of(
            "image/jpeg", "jpg",
            "image/jpg", "jpg",
            "image/png", "png",
            "image/webp", "webp",
            "image/heic", "heic",
            "image/heif", "heic"
    );

    private final ProfileService profileService;
    private final SupabaseStorageClient storageClient;

    /** 사진 업로드 (이미 있으면 교체하고 이전 사진은 저장소에서 삭제) */
    @Transactional
    public PhotoResponse upload(String ownerToken, MultipartFile file) {
        Profile profile = profileService.getByOwnerToken(ownerToken);

        if (file == null || file.isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_FILE);
        }
        if (file.getSize() > MAX_BYTES) {
            throw new CustomException(ErrorCode.FILE_TOO_LARGE);
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        String ext = ALLOWED_TYPES.get(contentType);
        if (ext == null) {
            throw new CustomException(ErrorCode.INVALID_FILE);
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new CustomException(ErrorCode.INVALID_FILE);
        }

        // 매번 새 파일 이름 → 앱의 이미지 캐시 때문에 예전 사진이 보이는 문제 방지
        String path = profile.getId() + "/" + UUID.randomUUID() + "." + ext;
        String newUrl = storageClient.upload(path, bytes, contentType);

        String oldUrl = profile.getPhotoUrl();
        profile.updatePhotoUrl(newUrl);
        storageClient.deleteByPublicUrl(oldUrl);

        return new PhotoResponse(newUrl);
    }

    /** 사진 삭제 → 기본 프로필 이미지로 */
    @Transactional
    public void delete(String ownerToken) {
        Profile profile = profileService.getByOwnerToken(ownerToken);
        String oldUrl = profile.getPhotoUrl();
        profile.updatePhotoUrl(null);
        storageClient.deleteByPublicUrl(oldUrl);
    }
}
