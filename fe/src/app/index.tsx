
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { getMyProfile } from "../lib/profileStorage";

export default function HomeScreen() {
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkProfile() {
      try {
        // 기기에 저장된 내 프로필 확인
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
          setError(true);
        }
      }
    }

    checkProfile();

    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      {error ? (
        <Text style={styles.errorText}>
          프로필 정보를 확인하지 못했습니다.
        </Text>
      ) : (
        <>
          <ActivityIndicator size="large" color="#7357F6" />
          <Text style={styles.loadingText}>
            프로필 확인 중...
          </Text>
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
  },
  loadingText: {
    marginTop: 16,
    color: "#77718C",
    fontSize: 14,
  },
  errorText: {
    color: "#D94848",
    fontSize: 14,
  },
});
