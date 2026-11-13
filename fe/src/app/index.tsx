
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { getMyProfile } from "../lib/profileStorage";
import { errorMessage } from "../lib/api";

export default function HomeScreen() {
  const [error, setError] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setSlow(false);

    // 서버가 잠들어 있으면 첫 응답이 늦음 → 안내 문구 표시
    const slowTimer = setTimeout(() => {
      if (active) setSlow(true);
    }, 4000);

    async function checkProfile() {
      try {
        // 서버에 내 프로필이 있는지 확인 (이 기기에 토큰이 없으면 바로 null)
        const profile = await getMyProfile();

        if (!active) return;

        if (profile) {
          // 이미 프로필이 존재하면 Main으로 이동
          router.replace("/profile_main");
        } else {
          // 프로필이 없으면 작성 화면으로 이동
          router.replace("/profile_write");
        }
      } catch (err) {
        console.error("프로필 확인 오류:", err);

        if (active) {
          setError(errorMessage(err));
        }
      } finally {
        clearTimeout(slowTimer);
      }
    }

    checkProfile();

    return () => {
      active = false;
      clearTimeout(slowTimer);
    };
  }, [attempt]);

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.errorText}>
            프로필 정보를 확인하지 못했습니다.
          </Text>
          <Text style={styles.subText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={retry}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#7357F6" />
          <Text style={styles.loadingText}>
            프로필 확인 중...
          </Text>
          {slow && (
            <Text style={styles.subText}>
              서버를 깨우는 중이에요. 처음엔 최대 1분 정도 걸릴 수 있어요.
            </Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    color: "#77718C",
    fontSize: 14,
  },
  subText: {
    marginTop: 10,
    color: "#A6A2B3",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  errorText: {
    color: "#D94848",
    fontSize: 14,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#7357F6",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
