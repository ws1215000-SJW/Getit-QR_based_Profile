
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

  // 동일한 QR이 연속으로 인식되는 문제 방지
  const scanningLocked = useRef(false);

  const resetScan = () => {
    scanningLocked.current = false;
    setScanned(false);
    setScannedId(null);
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

    const profileId = match[1];
    setScannedId(profileId);

    console.log("스캔한 프로필 ID:", profileId);
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
          <>
            <Text style={styles.resultTitle}>
              QR 인식 성공!
            </Text>

            <Text style={styles.resultDescription}>
              Getit 프로필 ID를 확인했어요.
            </Text>

            <Text
              style={styles.resultId}
              selectable
            >
              {scannedId}
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={resetScan}
            >
              <Text style={styles.primaryButtonText}>
                다른 QR 스캔
              </Text>
            </Pressable>
          </>
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

  secondaryButtonText: {
    color: "#77718C",
    fontSize: 14,
  },
});
