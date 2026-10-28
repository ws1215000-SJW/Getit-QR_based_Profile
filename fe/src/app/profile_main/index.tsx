
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getMyProfile,
  type MyProfile,
} from "../../lib/profileStorage";

import QRCode from "react-native-qrcode-svg";

import {
  getOrCreateQrId,
  buildQrValue,
} from "../../lib/qrIdentity";

const PURPLE = "#7357F6";
const BACKGROUND = "#F8F7FC";
const INK = "#211B38";

export default function ProfileMainScreen() {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [qrId, setQrId] = useState<string | null>(null);
  // 화면 높이에 따른 QR 영역 크기 조절
  const compact = height < 760;

  const qrSize = Math.min(
    width - 110,
    compact ? 160 : height < 860 ? 195 : 230
  );

  // 화면에 들어올 때마다 프로필 새로 불러오기
  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadProfile() {
        setLoading(true);
        setError(false);

        try {
          const saved = await getMyProfile();

          if (!active) return;

          if (!saved) {
            router.replace("/profile_write");
            return;
          }

          const id = await getOrCreateQrId();

          if (!active) return;

            setQrId(id);
            setProfile(saved);

          } catch (err) {
          console.error("프로필 조회 실패:", err);

          if (active) {
            setError(true);
            Alert.alert(
              "조회 오류",
              "프로필 정보를 불러오지 못했습니다."
            );
          }
        } finally {
          if (active) setLoading(false);
        }
      }

      loadProfile();

      return () => {
        active = false;
      };
    }, [])
  );

  // 로딩 및 오류 화면
  if (loading || error || !profile) {
    return (
      <View style={styles.loading}>
        {error ? (
          <Text style={styles.loadingText}>
            프로필을 불러오지 못했습니다.
          </Text>
        ) : (
          <>
            <ActivityIndicator size="large" color={PURPLE} />
            <Text style={styles.loadingText}>
              프로필을 불러오는 중...
            </Text>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* 화면 본문 */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: 18,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* GETIT 로고 */}
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandSymbol}>✦</Text>
          </View>

          <Text style={styles.brandText}>GETIT</Text>
        </View>

        {/* 나의 프로필 제목 및 수정 버튼 */}
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.eyebrow}>
              MY PROFILE
            </Text>

            <Text style={styles.heading}>
              나의 프로필
            </Text>
          </View>

          <Pressable
            style={styles.editButton}
            onPress={() => router.push("/profile_write")}
            accessibilityRole="button"
            accessibilityLabel="내 프로필 수정"
          >
            <Text style={styles.editText}>
              ✎ 수정
            </Text>
          </Pressable>
        </View>

        {/* 내 프로필 카드 */}
        <View
          style={[
            styles.profileCard,
            {
              paddingVertical: compact ? 15 : 20,
            },
          ]}
        >
          <View style={styles.profileRow}>
            {/* 프로필 사진 또는 기본 프사 */}
            <View style={styles.avatar}>
              {profile.photoUri ? (
                <Image
                  source={{ uri: profile.photoUri }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {profile.name.slice(0, 2)}
                </Text>
              )}
            </View>

            {/* 프로필 기본 정보 */}
            <View style={styles.profileDetails}>
              <View style={styles.nameRow}>
                <Text
                  style={styles.profileName}
                  numberOfLines={1}
                >
                  {profile.name}
                </Text>

                <Text style={styles.cardBadge}>
                  MY CARD
                </Text>
              </View>

              <Text
                style={styles.schoolText}
                numberOfLines={1}
              >
                {profile.school}
              </Text>

              <Text
                style={styles.departmentText}
                numberOfLines={1}
              >
                {profile.department}
              </Text>
            </View>
          </View>

          {/* 나이, 학번, MBTI, 동아리 */}
          <View style={styles.profileTags}>
            <Text style={styles.profileTag}>
              {profile.age}세
            </Text>

            {profile.studentId ? (
              <Text style={styles.profileTag}>
                {profile.studentId}
              </Text>
            ) : null}

            {profile.mbti ? (
              <Text style={styles.profileTag}>
                {profile.mbti}
              </Text>
            ) : null}

            {(profile.clubs ?? []).map((club) => (
              <Text
                key={club}
                style={styles.profileTag}
              >
                {club}
              </Text>
            ))}
          </View>
        </View>

        {/* QR 코드 영역 */}
        <View style={styles.qrCard}>
          <View style={styles.qrHeadingRow}>
            <View>
              <Text style={styles.eyebrow}>
                MY QR
              </Text>

              <Text style={styles.qrHeading}>
                내 프로필 공유
              </Text>
            </View>

            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />

              <Text style={styles.statusText}>
                QR 생성
              </Text>
            </View>
          </View>
        </View>
          
        {/* 실제 스캔 가능한 QR 코드 */}
        <View
        style={[
            styles.qrPlaceholder,
            {
            width: qrSize,
            height: qrSize,
            },
        ]}
        >
        {qrId ? (
            <QRCode
            value={buildQrValue(qrId)}
            size={Math.max(qrSize - 28, 80)}
            color="#211B38"
            backgroundColor="#FFFFFF"
            ecl="M"
            />
        ) : (
            <ActivityIndicator
            size="large"
            color={PURPLE}
            />
        )}
        </View>


        {/* QR 스캔 버튼 */}
        <Pressable
          style={styles.scanButton}
          onPress={() => router.push("/qr_scanner")}
          accessibilityRole="button"
        >
          <View style={styles.scanIconBox}>
            <Text style={styles.scanIcon}>▣</Text>
          </View>

          <View style={styles.scanCopy}>
            <Text style={styles.scanTitle}>
              상대방 QR 스캔하기
            </Text>

            <Text style={styles.scanSubtitle}>
              새로운 프로필을 저장해 보세요
            </Text>
          </View>

          <Text style={styles.scanArrow}>›</Text>
        </Pressable>
      </ScrollView>

      {/* 하단 네비게이션 */}
      <View
        style={[
          styles.bottomNav,
          {
            height: 64 + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* 현재 홈 탭 */}
        <View style={styles.navItem}>
          <Text style={styles.navIconActive}>
            ⌂
          </Text>

          <Text style={styles.navTextActive}>
            홈
          </Text>
        </View>

        {/* 저장 프로필 목록 이동 */}
        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/profile_list")}
          accessibilityRole="button"
        >
          <Text style={styles.navIcon}>
            ▤
          </Text>

          <Text style={styles.navText}>
            저장된 프로필
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  scroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 20,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BACKGROUND,
  },

  loadingText: {
    marginTop: 12,
    color: "#8C879B",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },

  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: PURPLE,
    justifyContent: "center",
    alignItems: "center",
  },

  brandSymbol: {
    fontSize: 20,
    color: "#FFFFFF",
  },

  brandText: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 3,
  },

  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  eyebrow: {
    color: "#A19AAF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 5,
  },

  heading: {
    color: INK,
    fontSize: 23,
    fontWeight: "800",
  },

  editButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4DEF9",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  editText: {
    color: "#5636D5",
    fontSize: 13,
    fontWeight: "700",
  },

  profileCard: {
    backgroundColor: "#7357E8",
    borderRadius: 24,
    paddingHorizontal: 18,
    marginBottom: 14,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: 62,
    height: 62,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  profileDetails: {
    flex: 1,
    gap: 4,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  profileName: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    flexShrink: 1,
  },

  cardBadge: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.17)",
  },

  schoolText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  departmentText: {
    color: "#E1D9FF",
    fontSize: 12,
  },

  profileTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 15,
  },

  profileTag: {
    color: "#FFFFFF",
    fontSize: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  qrCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F1EEF7",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: "center",
    marginBottom: 24,
  },

  qrHeadingRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  qrHeading: {
    color: INK,
    fontSize: 18,
    fontWeight: "800",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F7F5FA",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#F2B963",
  },

  statusText: {
    color: "#797286",
    fontSize: 10,
    fontWeight: "700",
  },

  qrPlaceholder: {
    backgroundColor: "#FBFAFF",
    borderWidth: 1,
    borderColor: "#EDE8F6",
    borderRadius: 20,
    justifyContent: "center",
    alignSelf: "center",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 10,
  },

  qrIcon: {
    color: "#C5B7F6",
    fontSize: 48,
  },

  qrTitle: {
    color: "#7760C9",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
  },

  qrPlaceholderText: {
    color: "#A19AAF",
    fontSize: 11,
    marginTop: 6,
  },

  qrCaption: {
    color: "#A6A0B4",
    fontSize: 10,
    textAlign: "center",
  },

  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#211B38",
    padding: 13,
    gap: 12,
    borderRadius: 19,
    marginTop: 16,
  },

  scanIconBox: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: PURPLE,
    justifyContent: "center",
    alignItems: "center",
  },

  scanIcon: {
    color: "#FFFFFF",
    fontSize: 26,
  },

  scanCopy: {
    flex: 1,
    gap: 4,
  },

  scanTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  scanSubtitle: {
    color: "#ADA8BB",
    fontSize: 10,
  },

  scanArrow: {
    color: "#FFFFFF",
    fontSize: 28,
  },

  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EBE8F1",
  },

  navItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 3,
  },

  navIconActive: {
    color: PURPLE,
    fontSize: 24,
  },

  navIcon: {
    color: "#AAA5B5",
    fontSize: 23,
  },

  navTextActive: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: "700",
  },

  navText: {
    color: "#AAA5B5",
    fontSize: 11,
    fontWeight: "700",
  },
});
