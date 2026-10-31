package com.getit.qrprofile.domain.savedprofile.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

public class SavedProfileRequest {

    @Getter
    @NoArgsConstructor
    public static class Save {
        @NotNull(message = "상대방 프로필 ID는 필수입니다.")
        private UUID targetProfileId;
    }

    @Getter
    @NoArgsConstructor
    public static class Update {
        private Boolean honorific;

        @Size(max = 200, message = "메모는 최대 200자까지 입력 가능합니다.")
        private String memo;
    }
}