import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ───────────── 타입 & 데이터 ───────────── */

export type Profile = {
  id: number;
  name: string;
  age: number;
  school: string;
  department: string;
  major: string;
  studentId: string;
  mbti: string;
  instagram: string;
  club: string;
  image: ImageSourcePropType;
  honorific: boolean;
  memo: string;
};

// 이미지는 assets/profiles/ 폴더에 넣어주세요 (RN은 require 경로가 정적이어야 함)
const initialProfiles: Profile[] = [
  {
    id: 1,
    name: "김서연",
    age: 22,
    school: "연세대학교",
    department: "시각디자인학과",
    major: "브랜드 디자인",
    studentId: "21학번",
    mbti: "ENFP",
    instagram: "@seoyeon.zip",
    club: "사진 동아리 포커스",
    image: require("../../../assets/profiles/seoyeon.jpg"),
    honorific: false,
    memo: "",
  },
  {
    id: 2,
    name: "박민준",
    age: 24,
    school: "고려대학교",
    department: "컴퓨터학과",
    major: "소프트웨어",
    studentId: "20학번",
    mbti: "ISTP",
    instagram: "@mjun.dev",
    club: "개발 동아리 KUCC",
    image: require("../../../assets/profiles/minjun.jpg"),
    honorific: true,
    memo: "",
  },
  {
    id: 3,
    name: "이하늘",
    age: 21,
    school: "성균관대학교",
    department: "미디어커뮤니케이션학과",
    major: "디지털 미디어",
    studentId: "23학번",
    mbti: "ISFJ",
    instagram: "@haneul.day",
    club: "방송 동아리 SUBS",
    image: require("../../../assets/profiles/haneul.jpg"),
    honorific: true,
    memo: "",
  },
  {
    id: 4,
    name: "정우진",
    age: 23,
    school: "한양대학교",
    department: "건축학부",
    major: "건축 설계",
    studentId: "22학번",
    mbti: "INTJ",
    instagram: "@woozin.arch",
    club: "러닝 크루 하이라이트",
    image: require("../../../assets/profiles/woozi.jpg"),
    honorific: false,
    memo: "",
  },
];

/* ───────────── 화면 간 공유 상태 (간단한 전역 저장소) ─────────────
   웹에서는 App 하나가 state를 들고 있었지만, 화면이 두 파일로 나뉘면
   state를 공유할 곳이 필요합니다. _layout.tsx 등 다른 파일을 건드리지 않도록
   이 파일 안에 저장소를 두고 profile_detail.tsx에서 가져다 씁니다. */

let store: Profile[] = initialProfiles;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => store;

export function useProfiles() {
     const profiles = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const updateProfile = (id: number, update: Partial<Profile>) => {
    store = store.map((p) => (p.id === id ? { ...p, ...update } : p));
    listeners.forEach((l) => l());
  };

  return { profiles, updateProfile };
}

/* ───────────── 하단 메뉴 ─────────────
   탭 레이아웃을 따로 쓰고 있다면 이 컴포넌트와 아래 <BottomNav />는 지워주세요. */

function BottomNav() {
  const insets = useSafeAreaInsets();
  const items = [
    { label: "홈", icon: "home-outline", active: false },
    { label: "저장 프로필", icon: "person-add-outline", active: true },
    { label: "내 프로필", icon: "person-outline", active: false },
  ] as const;

  return (
    <View style={[styles.bottomNav, { paddingBottom: insets.bottom, height: 78 + insets.bottom }]}>
      {items.map((item) => (
        <Pressable key={item.label} style={styles.navItem}>
          <Ionicons name={item.icon} size={22} color={item.active ? PURPLE : "#98a5ba"} />
          <Text style={[styles.navLabel, item.active && { color: PURPLE }]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/* ───────────── 목록 화면 ───────────── */

export default function ProfileList() {
  const router = useRouter();
  const { profiles, updateProfile } = useProfiles();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "honorific" | "casual">("all");

  const filteredProfiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      const matchesFilter =
        filter === "all" || (filter === "honorific" ? p.honorific : !p.honorific);
      const searchable = `${p.name} ${p.school} ${p.department}`.toLowerCase();
      return matchesFilter && searchable.includes(q);
    });
  }, [filter, profiles, query]);

  return (
    <View style={styles.page}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>MY CONNECTIONS</Text>
        <Text style={styles.title}>저장한 프로필</Text>
        <Text style={styles.subtitle}>소중한 인연을 잊지 않도록 모아두었어요.</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={22} color="#9eabc0" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="이름, 학교, 학과로 검색"
            placeholderTextColor="#aab4c6"
          />
        </View>

        <View style={styles.filters}>
          <Pressable
            style={[styles.filterBtn, filter === "all" && styles.filterBtnActive]}
            onPress={() => setFilter("all")}
          >
            <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>
              전체 {profiles.length}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterBtn, filter === "honorific" && styles.filterBtnActive]}
            onPress={() => setFilter((c) => (c === "honorific" ? "casual" : "honorific"))}
          >
            <Text style={[styles.filterText, filter === "honorific" && styles.filterTextActive]}>
              존댓말
            </Text>
          </Pressable>
        </View>

        <View style={styles.listMeta}>
          <Text style={styles.listMetaCount}>{filteredProfiles.length}명의 프로필</Text>
          <Text style={styles.listMetaSort}>최근 저장순</Text>
        </View>

        <View style={{ gap: 13 }}>
          {filteredProfiles.map((profile) => (
            <Pressable
              key={profile.id}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => router.push({
                pathname: "/profile_detail/[id]",
                params: { id: String(profile.id) },
                })
              }
            >
              <Image source={profile.image} style={styles.cardImage} />
              <View style={styles.summary}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardName}>{profile.name}</Text>
                  <Text style={styles.cardAge}>{profile.age}세</Text>
                </View>
                <Text style={styles.cardSchool} numberOfLines={1}>
                  {profile.school}
                </Text>
                <Text style={styles.cardDept} numberOfLines={1}>
                  {profile.department} · {profile.studentId}
                </Text>
                <View style={styles.mbtiBadge}>
                  <Text style={styles.mbtiText}>{profile.mbti}</Text>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#d6dce6"
                style={styles.cardChevron}
              />

              <View style={styles.cardToggle}>
                <Text style={styles.toggleLabel}>존댓말</Text>
                <Switch
                  value={profile.honorific}
                  onValueChange={(v) => updateProfile(profile.id, { honorific: v })}
                  trackColor={{ false: "#dfe5ef", true: PURPLE }}
                  thumbColor="#ffffff"
                />
              </View>
            </Pressable>
          ))}

          {filteredProfiles.length === 0 && (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search-outline" size={26} color={PURPLE} />
              </View>
              <Text style={styles.emptyTitle}>찾는 프로필이 없어요</Text>
              <Text style={styles.emptyDesc}>검색어나 필터를 다시 확인해 주세요.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

/* ───────────── 스타일 ───────────── */

const PURPLE = "#6549ff";
const PURPLE_DARK = "#5537f5";

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8f8fc" },
  content: { paddingTop: 64, paddingHorizontal: 22, paddingBottom: 130 },

  eyebrow: { color: PURPLE, fontSize: 11, fontWeight: "800", letterSpacing: 2.2, marginBottom: 8 },
  title: { color: "#111827", fontSize: 30, fontWeight: "800", letterSpacing: -1.5 },
  subtitle: { color: "#778298", fontSize: 15, marginTop: 14 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 62,
    marginTop: 30,
    paddingHorizontal: 20,
    gap: 12,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
    shadowColor: "#2f285b",
    shadowOpacity: 0.06,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "500", color: "#273145" },

  filters: { flexDirection: "row", gap: 9, marginTop: 18 },
  filterBtn: {
    minWidth: 76,
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 17,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e8eaf0",
    backgroundColor: "rgba(255,255,255,0.84)",
  },
  filterBtnActive: {
    borderColor: "transparent",
    backgroundColor: PURPLE,
    shadowColor: PURPLE,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  filterText: { color: "#69758a", fontSize: 13, fontWeight: "600" },
  filterTextActive: { color: "#ffffff" },

  listMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 25,
    marginBottom: 14,
    marginHorizontal: 4,
  },
  listMetaCount: { fontSize: 14, fontWeight: "700", color: "#172033" },
  listMetaSort: { fontSize: 12, color: "#a2adbe" },

  card: {
    flexDirection: "row",
    minHeight: 174,
    gap: 18,
    padding: 18,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    backgroundColor: "rgba(255,255,255,0.89)",
    shadowColor: "#4c4280",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 13 },
    elevation: 2,
  },
  cardImage: { width: 116, height: 136, borderRadius: 23 },
  summary: { flex: 1, minWidth: 0, paddingTop: 5 },
  cardTitleRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  cardName: { fontSize: 18, fontWeight: "800", letterSpacing: -0.7, color: "#172033" },
  cardAge: { fontSize: 13, color: "#91a0b6" },
  cardSchool: { marginTop: 7, fontSize: 13, fontWeight: "700", color: PURPLE_DARK },
  cardDept: { marginTop: 5, fontSize: 12, color: "#778297" },
  mbtiBadge: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#f4f1ff",
  },
  mbtiText: { fontSize: 11, fontWeight: "700", color: PURPLE },
  cardChevron: { position: "absolute", top: 25, right: 18 },
  cardToggle: {
    position: "absolute",
    right: 18,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  toggleLabel: { fontSize: 11, fontWeight: "600", color: "#6f7c91" },

  empty: {
    alignItems: "center",
    paddingVertical: 52,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  emptyIcon: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    borderRadius: 18,
    backgroundColor: "#f0edff",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#172033" },
  emptyDesc: { marginTop: 7, fontSize: 13, color: "#8d98ac" },

  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "rgba(234,236,243,0.85)",
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  navItem: { width: 90, alignItems: "center", gap: 4 },
  navLabel: { fontSize: 10, fontWeight: "600", color: "#98a5ba" },
});
