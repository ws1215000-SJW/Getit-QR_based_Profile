
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import * as ImagePicker from "expo-image-picker";

import {
  getMyProfile,
  saveMyProfile,
} from "../../lib/profileStorage";

type ProfileForm = {
  name: string;
  age: string;
  school: string;
  department: string;
  studentId: string;
  mbti: string;
  instagram: string;
};

type FormKey = keyof ProfileForm;

const PRIMARY = "#7357F6";
const DEFAULT_PHOTO = "#DDD5FF";

const EMPTY_FORM: ProfileForm = {
  name: "",
  age: "",
  school: "",
  department: "",
  studentId: "",
  mbti: "",
  instagram: "",
};

function normalizePhotoUri(
  uri: string | null | undefined
): string | null {
  if (typeof uri !== "string") return null;

  const trimmed = uri.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default function ProfileWriteScreen() {
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<ProfileForm>({ ...EMPTY_FORM });
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState(false);
  const [clubs, setClubs] = useState<string[]>([]);
  const [clubInput, setClubInput] = useState("");

  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 사진이 없거나 이미지 로딩에 실패하면 기본 원 표시
  const hasPhoto = photoUri !== null && !photoError;

  // 화면에 진입할 때 기존 프로필 정보 불러오기
  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadProfile() {
        setIsLoading(true);

        try {
          const saved = await getMyProfile();

          if (!active) return;

          if (saved) {
            setIsEditMode(true);
            setForm({
              name: saved.name ?? "",
              age: String(saved.age ?? ""),
              school: saved.school ?? "",
              department: saved.department ?? "",
              studentId: saved.studentId ?? "",
              mbti: saved.mbti ?? "",
              instagram: saved.instagram ?? "",
            });
            setClubs(saved.clubs ?? []);
            setPhotoUri(normalizePhotoUri(saved.photoUri));
          } else {
            setIsEditMode(false);
            setForm({ ...EMPTY_FORM });
            setClubs([]);
            setPhotoUri(null);
          }

          setPhotoError(false);
          setClubInput("");
        } catch (error) {
          console.error("프로필 조회 실패:", error);
          Alert.alert("오류", "프로필을 불러오지 못했습니다.");
        } finally {
          if (active) setIsLoading(false);
        }
      }

      loadProfile();

      return () => {
        active = false;
      };
    }, [])
  );

  // 입력값 업데이트
  const updateField = (key: FormKey, value: string) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // 갤러리에서 사진 선택
  const pickImage = async () => {
    if (isSaving) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setPhotoError(false);
        setPhotoUri(normalizePhotoUri(result.assets[0].uri));
      }
    } catch (error) {
      console.error("사진 선택 실패:", error);
      Alert.alert("오류", "사진을 선택하지 못했습니다.");
    }
  };

  // 사진 삭제: 몇 번 눌러도 기본 프로필을 유지
  const removePhoto = () => {
    if (isSaving) return;

    setPhotoUri(null);
    setPhotoError(false);
  };

  // 동아리 추가
  const addClub = () => {
    if (isSaving) return;

    const value = clubInput.trim();
    if (!value) return;

    if (clubs.includes(value)) {
      Alert.alert("중복", "이미 추가한 동아리입니다.");
      return;
    }

    setClubs((previous) => [...previous, value]);
    setClubInput("");
  };

  // 동아리 삭제
  const removeClub = (club: string) => {
    if (isSaving) return;

    setClubs((previous) =>
      previous.filter((item) => item !== club)
    );
  };

  // 필수 정보 및 형식 검사
  const validateForm = (): boolean => {
    if (
      !form.name.trim() ||
      !form.age.trim() ||
      !form.school.trim() ||
      !form.department.trim()
    ) {
      Alert.alert(
        "필수 항목 누락",
        "이름, 나이, 학교, 학과를 모두 입력해 주세요."
      );
      return false;
    }

    const age = Number(form.age);

    if (!Number.isInteger(age) || age < 1 || age > 120) {
      Alert.alert(
        "입력 오류",
        "나이는 1~120 사이의 숫자로 입력해 주세요."
      );
      return false;
    }

    const mbti = form.mbti.trim().toUpperCase();

    if (mbti && !/^[EI][SN][TF][JP]$/.test(mbti)) {
      Alert.alert(
        "입력 오류",
        "올바른 MBTI 유형을 입력해 주세요."
      );
      return false;
    }

    return true;
  };

  // Main으로 돌아가기
  const goBackToMain = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/profile_main");
    }
  };

  // 프로필 생성 및 수정 완료
  const handleSubmit = async () => {
    if (isSaving || isLoading) return;
    if (!validateForm()) return;

    const profileData = {
      name: form.name.trim(),
      age: Number(form.age),
      school: form.school.trim(),
      department: form.department.trim(),
      studentId: form.studentId.trim(),
      mbti: form.mbti.trim().toUpperCase(),
      instagram: form.instagram.trim(),
      clubs,
      photoUri: hasPhoto ? photoUri : null,
    };

    setIsSaving(true);

    try {
      await saveMyProfile(profileData);

      if (isEditMode) {
        goBackToMain();
      } else {
        router.replace("/profile_main");
      }
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      Alert.alert(
        "저장 실패",
        "프로필을 저장하지 못했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 공통 입력 필드
  const renderInput = (
    key: FormKey,
    label: string,
    placeholder: string,
    required = false,
    numeric = false
  ) => (
    <View style={styles.field} key={key}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && (
          <Text style={styles.required}>필수</Text>
        )}
      </View>

      <TextInput
        style={styles.input}
        value={form[key]}
        onChangeText={(value) => updateField(key, value)}
        placeholder={placeholder}
        placeholderTextColor="#A6A2B3"
        keyboardType={numeric ? "number-pad" : "default"}
        autoCapitalize="none"
        editable={!isSaving}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>
          프로필 정보를 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 16) + 24 },
      ]}
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {/* 상단 프로필 영역 */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12 },
        ]}
      >
        {/* 수정 화면에서만 뒤로 가기 */}
        {isEditMode && (
          <Pressable
            style={styles.backButton}
            onPress={goBackToMain}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="내 프로필로 돌아가기"
          >
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
        )}

        <Text style={styles.eyebrow}>
          GETIT · MY PROFILE
        </Text>

        <Text style={styles.title}>
          {isEditMode
            ? "나의 프로필을\n수정해 주세요."
            : "나의 프로필을\n작성해 주세요."}
        </Text>

        <Text style={styles.subtitle}>
          {isEditMode
            ? "기존 프로필 정보를 자유롭게 수정해 보세요."
            : "새로운 인연에게 보여줄 나의 정보를 입력해 보세요."}
        </Text>

        {/* 프로필 사진 선택 */}
        <Pressable
          style={styles.photoContainer}
          onPress={pickImage}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="프로필 사진 선택"
        >
          {hasPhoto ? (
            <Image
              source={{ uri: photoUri! }}
              style={styles.photo}
              onError={() => setPhotoError(true)}
            />
          ) : (
            <View style={styles.photoPlaceholder} />
          )}
        </Pressable>

        {/* 삭제 버튼: 사진 유무에 관계없이 항상 딱 하나 */}
        <Pressable
          style={styles.removePhotoButton}
          onPress={removePhoto}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="프로필 사진 삭제"
        >
          <Text style={styles.removePhotoText}>
            사진 삭제
          </Text>
        </Pressable>
      </View>

      {/* 기본 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionCaption}>BASIC INFO</Text>
        <Text style={styles.sectionTitle}>기본 정보</Text>

        {renderInput("name", "이름", "이름 입력", true)}
        {renderInput("age", "나이", "나이 입력", true, true)}
        {renderInput("school", "학교", "학교명 입력", true)}
        {renderInput("department", "학과", "학과명 입력", true)}
        {renderInput("studentId", "학번", "예: 25학번")}
      </View>

      {/* 추가 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionCaption}>ABOUT ME</Text>
        <Text style={styles.sectionTitle}>추가 정보</Text>

        {renderInput("mbti", "MBTI", "예: ENFP")}
        {renderInput(
          "instagram",
          "인스타그램",
          "인스타그램 아이디"
        )}

        {/* 동아리 */}
        <View style={styles.field}>
          <Text style={styles.label}>동아리</Text>

          <View style={styles.clubRow}>
            <TextInput
              style={[styles.input, styles.clubInput]}
              value={clubInput}
              onChangeText={setClubInput}
              placeholder="동아리 이름"
              placeholderTextColor="#A6A2B3"
              onSubmitEditing={addClub}
              editable={!isSaving}
            />

            <Pressable
              style={styles.addButton}
              onPress={addClub}
              disabled={isSaving}
            >
              <Text style={styles.addButtonText}>추가</Text>
            </Pressable>
          </View>

          <View style={styles.clubList}>
            {clubs.map((club) => (
              <Pressable
                key={club}
                style={styles.clubTag}
                onPress={() => removeClub(club)}
                disabled={isSaving}
              >
                <Text style={styles.clubTagText}>
                  {club} ×
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* 작성 / 수정 완료 */}
      <Pressable
        style={[
          styles.submitButton,
          isSaving && styles.disabledButton,
        ]}
        onPress={handleSubmit}
        disabled={isSaving}
      >
        <Text style={styles.submitText}>
          {isSaving
            ? "저장 중..."
            : isEditMode
              ? "수정 완료"
              : "프로필 작성 완료"}
        </Text>
      </Pressable>

      <Text style={styles.footerText}>
        프로필은 현재 기기 내부에 저장됩니다.
      </Text>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingBottom: 40,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 14,
    color: "#77718C",
    fontSize: 14,
  },
  header: {
    backgroundColor: "#F1EEFF",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  backButton: {
    alignSelf: "flex-start",
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    marginLeft: -10,
  },
  backArrow: {
    fontSize: 38,
    lineHeight: 42,
    color: "#302B40",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: PRIMARY,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#201B36",
    textAlign: "center",
    lineHeight: 38,
    marginTop: 14,
  },
  subtitle: {
    fontSize: 13,
    color: "#77718C",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 12,
  },

  // 사진이 없을 때: 연보라색 원
  photoContainer: {
    marginTop: 24,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: DEFAULT_PHOTO,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: DEFAULT_PHOTO,
  },
  photo: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },

  // 삭제 버튼은 항상 하나만
  removePhotoButton: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3DDF5",
  },
  removePhotoText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "700",
  },

  section: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  sectionCaption: {
    fontSize: 11,
    color: PRIMARY,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#211D30",
    marginTop: 6,
    marginBottom: 22,
  },
  field: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 9,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#302B40",
  },
  required: {
    fontSize: 11,
    fontWeight: "700",
    color: PRIMARY,
    backgroundColor: "#EEE9FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E6E2EF",
    borderRadius: 12,
    backgroundColor: "#FAF9FC",
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#211D30",
  },
  clubRow: {
    flexDirection: "row",
    gap: 9,
  },
  clubInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  clubList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  clubTag: {
    backgroundColor: "#EEE9FF",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  clubTagText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "600",
  },
  submitButton: {
    marginHorizontal: 24,
    marginTop: 28,
    height: 56,
    backgroundColor: PRIMARY,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  footerText: {
    marginTop: 14,
    paddingHorizontal: 24,
    color: "#9994A6",
    fontSize: 11,
    textAlign: "center",
  },
});
