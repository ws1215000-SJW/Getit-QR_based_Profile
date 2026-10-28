
import { router } from 'expo-router';
import { saveMyProfile } from '../../lib/profileStorage';
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import * as ImagePicker from "expo-image-picker";

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

export default function ProfileWriteScreen() {
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    age: "",
    school: "",
    department: "",
    studentId: "",
    mbti: "",
    instagram: "",
  });

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [clubs, setClubs] = useState<string[]>([]);
  const [clubInput, setClubInput] = useState("");

  const updateField = (key: FormKey, value: string) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // 프로필 사진 선택
  const pickImage = async () => {
    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (!result.canceled && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("오류", "사진을 불러오지 못했습니다.");
    }
  };

  // 동아리 추가
  const addClub = () => {
    const value = clubInput.trim();

    if (!value) return;

    if (clubs.includes(value)) {
      Alert.alert("알림", "이미 추가한 동아리입니다.");
      return;
    }

    setClubs((previous) => [...previous, value]);
    setClubInput("");
  };

  // 동아리 삭제
  const removeClub = (club: string) => {
    setClubs((previous) =>
      previous.filter((item) => item !== club)
    );
  };

  // 입력값 검증
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

    if (
      mbti &&
      !/^[EI][SN][TF][JP]$/.test(mbti)
    ) {
      Alert.alert(
        "입력 오류",
        "올바른 MBTI 유형을 입력해 주세요."
      );
      return false;
    }

    return true;
  };

  // 작성 완료
  
const handleSubmit = async () => {
  // 기존 필수값 검증
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
    photoUri,
  };

  try {
    // 프로필을 기기에 저장
    await saveMyProfile(profileData);

    // 저장 성공 시 내 프로필 화면으로 이동
    router.replace('/profile_main');
  } catch (error) {
    console.error('프로필 저장 실패:', error);

    Alert.alert(
      '저장 실패',
      '프로필을 저장하지 못했습니다. 다시 시도해 주세요.'
    );
  }
};


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
      />
    </View>
  );

  
  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >

        {/* 상단 소개 */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>GETIT · MY PROFILE</Text>

          <Text style={styles.title}>
            나의 프로필을{"\n"}작성해 주세요.
          </Text>

          <Text style={styles.subtitle}>
            새로운 인연에게 보여줄 나의 정보를 입력해 보세요.
          </Text>

          {/* 프로필 사진 */}
          <Pressable
            style={styles.photoContainer}
            onPress={pickImage}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={styles.photo}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoIcon}>+</Text>
                <Text style={styles.photoHint}>사진 추가</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* 기본 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionCaption}>BASIC INFO</Text>
          <Text style={styles.sectionTitle}>기본 정보</Text>

          {renderInput("name", "이름", "이름 입력", true)}
          {renderInput("age", "나이", "나이 입력", true, true)}
          {renderInput("school", "학교", "학교명 입력", true)}
          {renderInput(
            "department",
            "학과",
            "학과명 입력",
            true
          )}
          {renderInput(
            "studentId",
            "학번",
            "예: 25학번"
          )}
        </View>

        {/* 추가 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionCaption}>ABOUT ME</Text>
          <Text style={styles.sectionTitle}>추가 정보</Text>

          {renderInput(
            "mbti",
            "MBTI",
            "예: ENFP"
          )}

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
              />

              <Pressable
                onPress={addClub}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>
                  추가
                </Text>
              </Pressable>
            </View>

            <View style={styles.clubList}>
              {clubs.map((club) => (
                <Pressable
                  key={club}
                  style={styles.clubTag}
                  onPress={() => removeClub(club)}
                >
                  <Text style={styles.clubTagText}>
                    {club} ×
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* 완료 */}
        <Pressable
          onPress={handleSubmit}
          style={styles.submitButton}
        >
          <Text style={styles.submitText}>
            프로필 작성 완료
          </Text>
        </Pressable>

        <Text style={styles.footerText}>
          현재는 입력 테스트 단계이며 서버에는 저장되지 않습니다.
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
  header: {
    alignItems: "center",
    backgroundColor: "#F1EEFF",
    paddingTop: 36,
    paddingBottom: 30,
    paddingHorizontal: 24,
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
  photoContainer: {
    marginTop: 24,
  },
  photoPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#DDD5FF",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  photoIcon: {
    fontSize: 36,
    color: PRIMARY,
  },
  photoHint: {
    fontSize: 12,
    fontWeight: "600",
    color: PRIMARY,
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
    marginBottom: 9,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#302B40",
    marginBottom: 8,
  },
  required: {
    color: PRIMARY,
    backgroundColor: "#EEE9FF",
    fontSize: 11,
    fontWeight: "700",
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
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 18,
  },
  clubTagText: {
    color: PRIMARY,
    fontWeight: "600",
    fontSize: 12,
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
  submitText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  footerText: {
    fontSize: 11,
    color: "#9994A6",
    textAlign: "center",
    marginTop: 14,
    paddingHorizontal: 24,
  },
});
