package com.getit.qrprofile.global.storage;

import com.getit.qrprofile.global.exception.CustomException;
import com.getit.qrprofile.global.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Supabase Storage(사진 저장소)와 통신하는 클래스.
 * 서버만 service key를 갖고 있고, 앱은 업로드 결과로 받은 공개 URL로 사진을 보여준다.
 */
@Slf4j
@Component
public class SupabaseStorageClient {

    private final RestClient restClient = RestClient.create();
    private final String baseUrl;
    private final String serviceKey;
    private final String bucket;

    public SupabaseStorageClient(
            @Value("${app.supabase.url}") String baseUrl,
            @Value("${app.supabase.service-key}") String serviceKey,
            @Value("${app.supabase.bucket}") String bucket) {
        this.baseUrl = baseUrl == null ? "" : baseUrl.replaceAll("/+$", "");
        this.serviceKey = serviceKey;
        this.bucket = bucket;
    }

    /** 파일 업로드 후 공개 URL 반환. path 예: "{프로필ID}/{랜덤}.jpg" */
    public String upload(String path, byte[] bytes, String contentType) {
        checkConfigured();
        try {
            restClient.post()
                    .uri(baseUrl + "/storage/v1/object/" + bucket + "/" + path)
                    .header("Authorization", "Bearer " + serviceKey)
                    .header("apikey", serviceKey)
                    .header("x-upsert", "true")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(bytes)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.error("Supabase 업로드 실패: {}", e.getMessage());
            throw new CustomException(ErrorCode.STORAGE_ERROR);
        }
        return publicUrlPrefix() + path;
    }

    /** 이 서버가 올린 사진 URL이면 저장소에서 삭제. 실패해도 예외를 던지지 않음 (DB 정리가 우선) */
    public void deleteByPublicUrl(String publicUrl) {
        if (publicUrl == null || !isConfigured() || !publicUrl.startsWith(publicUrlPrefix())) {
            return;
        }
        String path = publicUrl.substring(publicUrlPrefix().length());
        try {
            restClient.delete()
                    .uri(baseUrl + "/storage/v1/object/" + bucket + "/" + path)
                    .header("Authorization", "Bearer " + serviceKey)
                    .header("apikey", serviceKey)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("Supabase 이전 사진 삭제 실패 (무시): {}", e.getMessage());
        }
    }

    private String publicUrlPrefix() {
        return baseUrl + "/storage/v1/object/public/" + bucket + "/";
    }

    private boolean isConfigured() {
        return !baseUrl.isBlank() && serviceKey != null && !serviceKey.isBlank();
    }

    private void checkConfigured() {
        if (!isConfigured()) {
            log.error("SUPABASE_URL / SUPABASE_SERVICE_KEY 가 .env 에 없습니다.");
            throw new CustomException(ErrorCode.STORAGE_ERROR);
        }
    }
}
