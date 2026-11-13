import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  errorMessage,
  getSavedProfiles,
  updateSavedProfile,
  type SavedProfileSummary,
} from "../../lib/api";

/* ───────────── 타입 ─────────────
   서버(GET /saved-profiles) 응답 그대로 사용. id = savedProfileId */
export type Profile = SavedProfileSummary;

/* ───────────── 서버에서 저장 목록 불러오기 ───────────── */

function useSavedProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "refresh") setRefreshing(true);
    setError(null);
    try {
      setProfiles(await getSavedProfiles());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 화면에 들어올 때마다 최신 목록 (상세에서 존댓말을 바꾸고 돌아와도 반영)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // 존댓말 토글: 화면 먼저 바꾸고 서버 저장, 실패하면 되돌림
  const updateHonorific = async (savedProfileId: number, honorific: boolean) => {
    setProfiles((prev) =>
      prev.map((p) => (p.savedProfileId === savedProfileId ? { ...p, honorific } : p))
    );
    try {
      await updateSavedProfile(savedProfileId, { honorific });
    } catch (e) {
      setProfiles((prev) =>
        prev.map((p) =>
          p.savedProfileId === savedProfileId ? { ...p, honorific: !honorific } : p
        )
      );
      Alert.alert("저장 실패", errorMessage(e));
    }
  };

  return { profiles, loading, refreshing, error, load, updateHonorific };
}

/* ───────────── 하단 메뉴 ─────────────
   탭 레이아웃을 따로 쓰고 있다면 이 컴포넌트와 아래 <BottomNav />는 지워주세요. */


function BottomNav() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const items = [
    {
      label: "홈",
      icon: "home-outline",
      route: "/profile_main",
      active: false,
    },
    {
      label: "저장 프로필",
      icon: "people-outline",
      route: "/profile_list",
      active: true,
    },
  ] as const;

  return (
    <View
      style={[
        styles.bottomNav,
        {
          paddingBottom: insets.bottom,
          height: 64 + insets.bottom,
        },
      ]}
    >
      {items.map((item) => (
        <Pressable
          key={item.label}
          style={styles.navItem}
          onPress={() => {
            if (!item.active) {
              router.replace(item.route);
            }
          }}
        >
          <Ionicons
            name={item.icon}
            size={22}
            color={item.active ? PURPLE : "#98a5ba"}
          />

          <Text
            style={[
              styles.navLabel,
              item.active && { color: PURPLE },
            ]}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}


/* ───────────── 목록 화면 ───────────── */

export default function ProfileList() {
  const router = useRouter();
  const { profiles, loading, refreshing, error, load, updateHonorific } =
    useSavedProfiles();
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load("refresh")} />
        }
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

        
        {/* 프로필 말투 필터 */}
        <View style={styles.filters}>
          {/* 전체 */}
          <Pressable
            style={[
              styles.filterBtn,
              filter === "all" && styles.filterBtnActive,
            ]}
            onPress={() => setFilter("all")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "all" && styles.filterTextActive,
              ]}
            >
              전체 {profiles.length}
            </Text>
          </Pressable>

          {/* 존댓말 */}
          <Pressable
            style={[
              styles.filterBtn,
              filter === "honorific" && styles.filterBtnActive,
            ]}
            onPress={() => setFilter("honorific")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "honorific" && styles.filterTextActive,
              ]}
            >
              존댓말
            </Text>
          </Pressable>

          {/* 반말 */}
          <Pressable
            style={[
              styles.filterBtn,
              filter === "casual" && styles.filterBtnActive,
            ]}
            onPress={() => setFilter("casual")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "casual" && styles.filterTextActive,
              ]}
            >
              반말
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
              key={profile.savedProfileId}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => router.push({
                pathname: "/profile_detail/[id]",
                params: { id: String(profile.savedProfileId) },
                })
              }
            >
              {profile.photoUrl ? (
                <Image source={{ uri: profile.photoUrl }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                  <Text style={styles.cardImageText}>{profile.name.slice(0, 2)}</Text>
                </View>
              )}
              <View style={styles.summary}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardName}>{profile.name}</Text>
                  <Text style={styles.cardAge}>{profile.age}세</Text>
                </View>
                <Text style={styles.cardSchool} numberOfLines={1}>
                  {profile.school}
                </Text>
                <Text style={styles.cardDept} numberOfLines={1}>
                  {profile.studentId
                    ? `${profile.department} · ${profile.studentId}`
                    : profile.department}
                </Text>
                {profile.mbti ? (
                  <View style={styles.mbtiBadge}>
                    <Text style={styles.mbtiText}>{profile.mbti}</Text>
                  </View>
                ) : null}
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#d6dce6"
                style={styles.cardChevron}
              />      
              <View style={styles.cardToggle}>
                <SpeechToggle
                  honorific={profile.honorific}
                  onChange={(value) =>
                    updateHonorific(profile.savedProfileId, value)
                  }
                />
              </View>
            </Pressable>
          ))}

          {loading && (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color={PURPLE} />
              <Text style={styles.emptyDesc}>저장한 프로필을 불러오는 중...</Text>
            </View>
          )}

          {!loading && error && (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="cloud-offline-outline" size={26} color={PURPLE} />
              </View>
              <Text style={styles.emptyTitle}>목록을 불러오지 못했어요</Text>
              <Text style={styles.emptyDesc}>{error}</Text>
              <Pressable onPress={() => load()} style={styles.emptyAction}>
                <Text style={styles.emptyActionText}>다시 시도</Text>
              </Pressable>
            </View>
          )}

          {!loading && !error && profiles.length === 0 && (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="qr-code-outline" size={26} color={PURPLE} />
              </View>
              <Text style={styles.emptyTitle}>아직 저장한 프로필이 없어요</Text>
              <Text style={styles.emptyDesc}>새로 만난 사람의 QR을 스캔해 보세요.</Text>
              <Pressable
                onPress={() => router.push("/qr_scanner")}
                style={styles.emptyAction}
              >
                <Text style={styles.emptyActionText}>QR 스캔하기</Text>
              </Pressable>
            </View>
          )}

          {!loading && !error && profiles.length > 0 && filteredProfiles.length === 0 && (
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

type SpeechToggleProps = {
  honorific: boolean;
  onChange: (value: boolean) => void;
};

function SpeechToggle({
  honorific,
  onChange,
}: SpeechToggleProps) {
  return (
    <View style={styles.speechToggle}>
      <Pressable
        style={[
          styles.speechOption,
          !honorific && styles.speechOptionActive,
        ]}
        onPress={() => onChange(false)}
        accessibilityRole="button"
        accessibilityState={{ selected: !honorific }}
      >
        <Text
          style={[
            styles.speechOptionText,
            !honorific && styles.speechOptionTextActive,
          ]}
        >
          반말
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.speechOption,
          honorific && styles.speechOptionActive,
        ]}
        onPress={() => onChange(true)}
        accessibilityRole="button"
        accessibilityState={{ selected: honorific }}
      >
        <Text
          style={[
            styles.speechOptionText,
            honorific && styles.speechOptionTextActive,
          ]}
        >
          존댓말
        </Text>
      </Pressable>
    </View>
  );
}

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
    borderColor: "#FFFFFF",
    shadowColor: "#FFFFFF",
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
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
    shadowColor: "#4c4280",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 13 },
    elevation: 2,
  },
  cardImage: { width: 116, height: 136, borderRadius: 23 },
  cardImagePlaceholder: {
    backgroundColor: "#ece8ff",
    alignItems: "center",
    justifyContent: "center",
  },
  cardImageText: { fontSize: 26, fontWeight: "800", color: PURPLE },
  emptyAction: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: PURPLE,
  },
  emptyActionText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
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

  
  speechToggle: {
    flexDirection: "row",
    backgroundColor: "#EDE9F7",
    borderRadius: 999,
    padding: 3,
    width: 146,
    height: 38,
    alignItems: "center",
  },

  speechOption: {
    flex: 1,
    height: 32,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  speechOptionActive: {
    backgroundColor: "#7357F6",
  },

  speechOptionText: {
    color: "#77718C",
    fontSize: 11,
    fontWeight: "700",
  },

  speechOptionTextActive: {
    color: "#FFFFFF",
  },

  cardToggle: {
    position: "absolute",
    right: 14,
    bottom: 14,
  },

  navItem: { width: 90, alignItems: "center", gap: 4 },
  navLabel: { fontSize: 10, fontWeight: "600", color: "#98a5ba" },
});
