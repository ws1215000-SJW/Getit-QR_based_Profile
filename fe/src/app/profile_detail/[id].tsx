import {
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
import { useProfiles } from "../profile_list";

const PURPLE = "#6549ff";

export default function ProfileDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profiles, updateProfile } = useProfiles();

  const profile = profiles.find((p) => p.id === Number(id));

  if (!profile) {
    return (
      <View style={styles.notFound}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text>프로필을 찾을 수 없어요.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: PURPLE, marginTop: 12 }}>뒤로 가기</Text>
        </Pressable>
      </View>
    );
  }

  const details: [string, string][] = [
    ["학교", profile.school],
    ["학과", profile.department],
    ["전공", profile.major],
    ["학번", profile.studentId],
    ["MBTI", profile.mbti],
    ["인스타", profile.instagram],
    ["동아리", profile.club],
  ];

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
            onPress={() => router.back()}
            accessibilityLabel="뒤로 가기"
          >
            <Ionicons name="chevron-back" size={22} color="#ffffff" />
          </Pressable>

          <Image source={profile.image} style={styles.avatar} />
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
                  value={profile.honorific}
                  onValueChange={(v) => updateProfile(profile.id, { honorific: v })}
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
              value={profile.memo}
              onChangeText={(text) => updateProfile(profile.id, { memo: text })}
              placeholder="기억해두고 싶은 이야기를 적어보세요."
              placeholderTextColor="#aab4c5"
              textAlignVertical="top"
              accessibilityLabel={`${profile.name}에 대한 메모`}
            />
            <Text style={styles.memoCount}>{profile.memo.length}/200</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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