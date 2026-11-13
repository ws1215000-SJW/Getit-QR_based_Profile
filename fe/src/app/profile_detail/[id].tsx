import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  errorMessage,
  getSavedProfile,
  updateSavedProfile,
  type SavedProfileDetail,
} from "../../lib/api";

const PURPLE = "#6549ff";
const MEMO_SAVE_DELAY = 800; // 입력을 멈추고 0.8초 뒤 자동 저장

type MemoStatus = "idle" | "saving" | "saved" | "error";

export default function ProfileDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [detail, setDetail] = useState<SavedProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [honorific, setHonorific] = useState(false);
  const [memo, setMemo] = useState("");
  const [memoStatus, setMemoStatus] = useState<MemoStatus>("idle");

  const lastSavedMemo = useRef("");
  const memoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMemo = useRef<string | null>(null);

  // 상세 정보 불러오기
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getSavedProfile(id);
      setDetail(data);
      setHonorific(data.honorific);
      setMemo(data.memo ?? "");
      lastSavedMemo.current = data.memo ?? "";
    } catch (e) {
      setLoadError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // 메모 서버 저장
  const saveMemo = useCallback(
    async (text: string) => {
      if (text === lastSavedMemo.current) {
        pendingMemo.current = null;
        return;
      }
      setMemoStatus("saving");
      try {
        await updateSavedProfile(id, { memo: text });
        lastSavedMemo.current = text;
        pendingMemo.current = null;
        setMemoStatus("saved");
      } catch {
        setMemoStatus("error");
      }
    },
    [id]
  );

  const handleMemoChange = (text: string) => {
    setMemo(text);
    setMemoStatus("idle");
    pendingMemo.current = text;
    if (memoTimer.current) clearTimeout(memoTimer.current);
    memoTimer.current = setTimeout(() => saveMemo(text), MEMO_SAVE_DELAY);
  };

  const flushMemo = () => {
    if (memoTimer.current) clearTimeout(memoTimer.current);
    if (pendingMemo.current !== null) saveMemo(pendingMemo.current);
  };

  // 화면을 나갈 때 아직 저장 안 된 메모가 있으면 저장
  useEffect(() => {
    return () => {
      if (memoTimer.current) clearTimeout(memoTimer.current);
      if (pendingMemo.current !== null && pendingMemo.current !== lastSavedMemo.current) {
        updateSavedProfile(id, { memo: pendingMemo.current }).catch(() => {});
      }
    };
  }, [id]);

  // 존댓말 스위치: 먼저 화면 반영 → 서버 저장 → 실패 시 되돌림
  const handleHonorificChange = async (value: boolean) => {
    setHonorific(value);
    try {
      await updateSavedProfile(id, { honorific: value });
    } catch (e) {
      setHonorific(!value);
      Alert.alert("저장 실패", errorMessage(e));
    }
  };

  if (loading || loadError || !detail) {
    return (
      <View style={styles.notFound}>
        <Stack.Screen options={{ headerShown: false }} />
        {loading ? (
          <>
            <ActivityIndicator size="large" color={PURPLE} />
            <Text style={{ marginTop: 12, color: "#8d98ac" }}>프로필을 불러오는 중...</Text>
          </>
        ) : (
          <>
            <Text>프로필을 불러오지 못했어요.</Text>
            {loadError ? (
              <Text style={{ marginTop: 6, color: "#8d98ac", textAlign: "center" }}>
                {loadError}
              </Text>
            ) : null}
            <Pressable onPress={load}>
              <Text style={{ color: PURPLE, marginTop: 14 }}>다시 시도</Text>
            </Pressable>
          </>
        )}
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: PURPLE, marginTop: 12 }}>뒤로 가기</Text>
        </Pressable>
      </View>
    );
  }

  const profile = detail.profile;

  const details: [string, string][] = [
    ["학교", profile.school],
    ["학과", profile.department],
    ["전공", profile.major ?? "-"],
    ["학번", profile.studentId ?? "-"],
    ["MBTI", profile.mbti ?? "-"],
    ["인스타", profile.instagram ? `@${profile.instagram}` : "-"],
    ["동아리", profile.clubs.length > 0 ? profile.clubs.join(", ") : "-"],
  ];

  const memoStatusText =
    memoStatus === "saving"
      ? "저장 중..."
      : memoStatus === "saved"
        ? "저장됨"
        : memoStatus === "error"
          ? "저장 실패 · 다시 입력해 주세요"
          : "";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f8f8fc" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 42 + insets.bottom }}
      >
        {/* 상단 히어로 */}
        <LinearGradient
          colors={["#6d4dff", "#9b52fc", "#d866ef"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 56 }]}
        >
          <Pressable
            style={[styles.backBtn, { top: insets.top + 12 }]}
            onPress={() => {
              flushMemo();
              router.back();
            }}
            accessibilityLabel="뒤로 가기"
          >
            <Ionicons name="chevron-back" size={22} color="#ffffff" />
          </Pressable>

          {profile.photoUrl ? (
            <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{profile.name.slice(0, 2)}</Text>
            </View>
          )}
          <View style={styles.nameRow}>
            <Text style={styles.heroName}>{profile.name}</Text>
            <Text style={styles.heroAge}>{profile.age}세</Text>
          </View>
          <Text style={styles.heroSub}>
            {profile.school} · {profile.department}
          </Text>
        </LinearGradient>

        <View style={styles.detailContent}>
          {/* 기본 정보 */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>기본 정보</Text>
              <View style={styles.toggleChip}>
                <Text style={styles.toggleLabel}>존댓말 사용</Text>
                <Switch
                  value={honorific}
                  onValueChange={handleHonorificChange}
                  trackColor={{ false: "#dfe5ef", true: PURPLE }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {details.map(([label, value], index) => (
              <View
                key={label}
                style={[styles.infoRow, index === details.length - 1 && { borderBottomWidth: 0 }]}
              >
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            ))}
          </View>

          {/* 메모 */}
          <View style={[styles.card, { padding: 25 }]}>
            <View style={styles.memoHeader}>
              <View style={styles.noteIcon}>
                <Ionicons name="document-text-outline" size={20} color={PURPLE} />
              </View>
              <Text style={styles.cardTitle}>나만의 메모</Text>
            </View>
            <TextInput
              style={styles.memoInput}
              multiline
              maxLength={200}
              value={memo}
              onChangeText={handleMemoChange}
              onBlur={flushMemo}
              placeholder="기억해두고 싶은 이야기를 적어보세요."
              placeholderTextColor="#aab4c5"
              textAlignVertical="top"
              accessibilityLabel={`${profile.name}에 대한 메모`}
            />
            <Text style={styles.memoCount}>
              {memoStatusText ? `${memoStatusText} · ` : ""}
              {memo.length}/200
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  avatarPlaceholder: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#ffffff", fontSize: 30, fontWeight: "800" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },

  hero: { alignItems: "center", paddingBottom: 36, minHeight: 372 },
  backBtn: {
    position: "absolute",
    left: 20,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  avatar: {
    width: 136,
    height: 136,
    borderRadius: 39,
    borderWidth: 5,
    borderColor: "rgba(255,255,255,0.88)",
  },
  nameRow: { flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 22 },
  heroName: { color: "#ffffff", fontSize: 28, fontWeight: "800", letterSpacing: -1.4 },
  heroAge: { color: "rgba(255,255,255,0.82)", fontSize: 14 },
  heroSub: { color: "rgba(255,255,255,0.86)", fontSize: 14, marginTop: 6 },

  detailContent: { gap: 18, paddingHorizontal: 20, paddingTop: 24 },
  card: {
    borderRadius: 29,
    borderWidth: 1,
    borderColor: "#ffffff",
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 25,
    paddingTop: 27,
    paddingBottom: 15,
    shadowColor: "#4c4280",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 13 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 19,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.5, color: "#172033" },
  toggleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingLeft: 12,
    paddingRight: 6,
    borderRadius: 999,
    backgroundColor: "#f5f7fb",
  },
  toggleLabel: { fontSize: 11, fontWeight: "600", color: "#6f7c91" },

  infoRow: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#edf0f5",
  },
  infoLabel: { width: 82, fontSize: 14, color: "#9aa6b9" },
  infoValue: { flex: 1, fontSize: 14, fontWeight: "600", color: "#3b4658" },

  memoHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  noteIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#f2efff",
  },
  memoInput: {
    height: 126,
    padding: 17,
    borderRadius: 18,
    backgroundColor: "#f8f9fc",
    color: "#3c4658",
    fontSize: 13,
    lineHeight: 22,
  },
  memoCount: { marginTop: 10, textAlign: "right", fontSize: 11, color: "#98a5ba" },
});