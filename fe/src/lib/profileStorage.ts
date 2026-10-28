
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = 'getit_my_profile';

export type MyProfile = {
  name: string;
  age: number;
  school: string;
  department: string;
  studentId: string;
  mbti: string;
  instagram: string;
  clubs: string[];
  photoUri: string | null;
};

// 프로필 저장
export async function saveMyProfile(profile: MyProfile) {
  await AsyncStorage.setItem(
    PROFILE_KEY,
    JSON.stringify(profile)
  );
}

// 저장된 프로필 불러오기
export async function getMyProfile(): Promise<MyProfile | null> {
  const stored = await AsyncStorage.getItem(PROFILE_KEY);

  if (!stored) {
    return null;
  }

  return JSON.parse(stored) as MyProfile;
}

// 개발 테스트용 프로필 삭제
export async function deleteMyProfile() {
  await AsyncStorage.removeItem(PROFILE_KEY);
}
