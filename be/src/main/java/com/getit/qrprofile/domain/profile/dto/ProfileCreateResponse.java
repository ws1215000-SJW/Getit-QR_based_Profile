package com.getit.qrprofile.domain.profile.dto;

/**
 * POST /profiles 응답.
 * ownerToken은 이 응답에서 딱 한 번만 내려준다 → 앱이 AsyncStorage에 저장해서 이후 X-Owner-Token 헤더로 사용.
 */
public record ProfileCreateResponse(
        ProfileResponse profile,
        String ownerToken
) {
}
