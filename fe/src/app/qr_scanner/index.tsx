
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { router, useIsFocused } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ApiError,
  errorMessage,
  getProfileById,
  saveProfile,
  type ServerProfile,
} from "../../lib/api";

const PRIMARY = "#7357F6";

const PROFILE_QR_PATTERN =
  /^getit:profile:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export default function QrScannerScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const [permission, requestPermission] =
    useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [scannedId, setScannedId] = useState<string | null>(null);

  // 스캔한 상대 프로필 미리보기
  const [preview, setPreview] = useState<ServerProfile | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 동일한 QR이 연속으로 인식되는 문제 방지
  const scanningLocked = useRef(false);

  const resetScan = () => {
    scanningLocked.current = false;
    setScanned(false);
    setScannedId(null);
    setPreview(null);
    setPreviewError(null);
    setPreviewLoading(false);
    setSaving(false);
  };

  // 서버에서 상대 프로필 불러오기
  const loadPreview = async (profileId: string) => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      setPreview(await getProfileById(profileId));
    } catch (error) {
      setPreviewError(
        error instanceof ApiError && error.code === "PROFILE_NOT_FOUND"
          ? "아직 프로필을 만들지 않은 QR이에요."
          : errorMessage(error)
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  // 내 인맥 목록에 저장
  const handleSave = async () => {
    if (!preview || saving) return;
    setSaving(true);
    try {
      const { savedProfileId } = await saveProfile(preview.id);
      router.replace({
        pathname: "/profile_detail/[id]",
        params: { id: String(savedProfileId) },
      });
    } catch (error) {
      setSaving(false);
      if (error instanceof ApiError && error.code === "ALREADY_SAVED") {
        Alert.alert("이미 저장한 프로필이에요", "저장 목록에서 확인할 수 있어요.", [
          { text: "다시 스캔", onPress: resetScan },
          { text: "목록 보기", onPress: () => router.replace("/profile_list") },
        ]);
      } else if (error instanceof ApiError && error.code === "CANNOT_SAVE_SELF") {
        Alert.alert("내 QR이에요", "자기 자신은 저장할 수 없어요.", [
          { text: "다시 스캔", onPress: resetScan },
        ]);
      } else {
        Alert.alert("저장 실패", errorMessage(error));
      }
    }
  };

  const handleBarcodeScanned = (
    result: BarcodeScanningResult
  ) => {
    if (scanningLocked.current) return;

    scanningLocked.current = true;
    setScanned(true);

    const data = result.data.trim();
    const match = data.match(PROFILE_QR_PATTERN);

    if (!match) {
      Alert.alert(
        "Getit QR이 아니에요",
        "Getit에서 생성한 프로필 QR코드를 스캔해 주세요.",
        [
          {
            text: "다시 스캔",
            onPress: resetScan,
          },
        ],
        {
          cancelable: false,
        }
      );
      return;
    }

    const profileId = match[1].toLowerCase();
    setScannedId(profileId);
    loadPreview(profileId);
  };

  // 권한 상태 로딩
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.message}>
          카메라 권한 확인 중...
        </Text>
      </View>
    );
  }

  // 카메라 권한 없음
  if (!permission.granted) {
    return (
      <View
        style={[
          styles.center,
          { paddingTop: insets.top },
        ]}
      >
        <Text style={styles.permissionTitle}>
          카메라 권한이 필요해요
        </Text>

        <Text style={styles.message}>
          QR코드를 스캔하기 위해 카메라 접근을 허용해 주세요.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={requestPermission}
        >
          <Text style={styles.primaryButtonText}>
            카메라 권한 허용
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>
            돌아가기
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 카메라 미리보기 */}
      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          active={!scanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={
            scanned ? undefined : handleBarcodeScanned
          }
        />
      )}

      {/* 상단 안내 */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 20 },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>

        <Text style={styles.title}>QR 스캔</Text>
        <Text style={styles.subtitle}>
          상대방의 Getit QR코드를 인식해 주세요.
        </Text>
      </View>

      {/* 스캔 가이드 */}
      <View
        style={styles.scannerArea}
        pointerEvents="none"
      >
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      {/* 스캔 결과 */}
      <View
        style={[
          styles.bottomPanel,
          { paddingBottom: insets.bottom + 28 },
        ]}
      >
        {scannedId ? (
          previewLoading ? (
            <>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.resultDescription}>
                상대 프로필을 불러오는 중...
              </Text>
            </>
          ) : preview ? (
            <>
              <View style={styles.previewRow}>
                <View style={styles.previewAvatar}>
                  {preview.photoUrl ? (
                    <Image
                      source={{ uri: preview.photoUrl }}
                      style={styles.previewAvatarImage}
                    />
                  ) : (
                    <Text style={styles.previewAvatarText}>
                      {preview.name.slice(0, 2)}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {preview.name}{" "}
                    <Text style={styles.previewAge}>{preview.age}세</Text>
                  </Text>
                  <Text style={styles.previewSub} numberOfLines={1}>
                    {preview.school} · {preview.department}
                  </Text>
                  {preview.mbti ? (
                    <Text style={styles.previewMbti}>{preview.mbti}</Text>
                  ) : null}
                </View>
              </View>

              <Pressable
                style={[styles.primaryButton, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? "저장 중..." : "내 인맥에 저장하기"}
                </Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={resetScan}>
                <Text style={styles.secondaryButtonLight}>다른 QR 스캔</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.resultTitle}>프로필을 불러오지 못했어요</Text>
              <Text style={styles.resultDescription}>{previewError}</Text>
              <Pressable style={styles.primaryButton} onPress={resetScan}>
                <Text style={styles.primaryButtonText}>다시 스캔</Text>
              </Pressable>
            </>
          )
        ) : (
          <Text style={styles.guideText}>
            QR코드를 사각형 안에 맞춰 주세요.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171825",
  },

  center: {
    flex: 1,
    backgroundColor: "#F8F7FC",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

  permissionTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#211B38",
    marginBottom: 12,
    textAlign: "center",
  },

  message: {
    fontSize: 14,
    color: "#77718C",
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 24,
  },

  header: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    backgroundColor: "rgba(14, 13, 25, 0.72)",
    alignItems: "center",
  },

  closeButton: {
    alignSelf: "flex-start",
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },

  closeText: {
    fontSize: 34,
    color: "#FFFFFF",
    lineHeight: 38,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
    marginTop: 8,
  },

  subtitle: {
    color: "#D7D1E7",
    fontSize: 13,
    marginTop: 10,
  },

  scannerArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  scanFrame: {
    width: 260,
    height: 260,
    position: "relative",
  },

  corner: {
    position: "absolute",
    width: 36,
    height: 36,
    borderColor: "#B6A7FF",
    borderWidth: 5,
  },

  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },

  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },

  bottomPanel: {
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: "rgba(14, 13, 25, 0.85)",
    alignItems: "center",
  },

  guideText: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
  },

  resultTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  resultDescription: {
    color: "#D7D1E7",
    fontSize: 13,
    marginTop: 10,
  },

  resultId: {
    color: "#C5B8FF",
    fontSize: 12,
    marginTop: 14,
    marginBottom: 20,
    textAlign: "center",
  },

  primaryButton: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 12,
    minWidth: 180,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  secondaryButton: {
    padding: 15,
    marginTop: 12,
  },

  secondaryButtonLight: {
    color: "#D7D1E7",
    fontSize: 14,
  },

  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    alignSelf: "stretch",
    marginBottom: 8,
  },

  previewAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#DDD5FF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  previewAvatarImage: {
    width: "100%",
    height: "100%",
  },

  previewAvatarText: {
    color: PRIMARY,
    fontSize: 20,
    fontWeight: "800",
  },

  previewAge: {
    color: "#D7D1E7",
    fontSize: 15,
    fontWeight: "600",
  },

  previewSub: {
    color: "#D7D1E7",
    fontSize: 13,
    marginTop: 4,
  },

  previewMbti: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(197, 184, 255, 0.2)",
    color: "#C5B8FF",
    fontSize: 11,
    fontWeight: "700",
  },

  secondaryButtonText: {
    color: "#77718C",
    fontSize: 14,
  },
});
