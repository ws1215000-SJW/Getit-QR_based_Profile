import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  ApiError,
  clearOwnerToken,
  createProfile,
  deletePhoto,
  getMe,
  getOwnerToken,
  updateMe,
  uploadPhoto,
  type ProfileInput,
  type ServerProfile,
} from "./api";
import { getOrCreateQrId, resetQrId } from "./qrIdentity";

/**
 * 내 프로필 저장소.
 * 예전에는 기기(AsyncStorage)에만 저장했지만, 이제는 서버(Spring + Supabase)에 저장한다.
 * 화면 코드가 바뀌지 않도록 함수 이름과 MyProfile 모양은 그대로 유지.
 */

const LEGACY_PROFILE_KEY = "getit_my_profile"; // 예전 로컬 저장 데이터 (정리용)

export type MyProfile = {
  id?: string;
  name: string;
  age: number;
  school: string;
  department: string;
  studentId: string;
  mbti: string;
  instagram: string;
  clubs: string[];
  photoUri: string | null; // 서버 사진 URL 또는 방금 고른 기기 사진 경로
};

function toMyProfile(p: ServerProfile): MyProfile {
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    school: p.school,
    department: p.department,
    studentId: p.studentId ?? "",
    mbti: p.mbti ?? "",
    instagram: p.instagram ?? "",
    clubs: p.clubs ?? [],
    photoUri: p.photoUrl,
  };
}

/** 서버에서 내 프로필 불러오기. 아직 만들지 않았으면 null */
export async function getMyProfile(): Promise<MyProfile | null> {
  const token = await getOwnerToken();
  if (!token) return null;

  try {
    return toMyProfile(await getMe());
  } catch (error) {
    // 토큰이 서버에 없음(DB 초기화 등) → 처음부터 다시 만들도록
    if (error instanceof ApiError && error.status === 401) {
      await clearOwnerToken();
      return null;
    }
    throw error;
  }
}

/**
 * 프로필 저장 (처음이면 생성, 이미 있으면 수정) + 사진 반영.
 * photoMimeType: 이미지 선택기에서 받은 형식 (없으면 확장자로 추측)
 */
export async function saveMyProfile(
  profile: MyProfile,
  photoMimeType?: string | null
): Promise<MyProfile> {
  const input: ProfileInput = {
    name: profile.name,
    age: profile.age,
    school: profile.school,
    department: profile.department,
    studentId: profile.studentId,
    mbti: profile.mbti,
    instagram: profile.instagram,
    clubs: profile.clubs,
  };

  const token = await getOwnerToken();
  let saved: ServerProfile;

  if (token) {
    saved = await updateMe(input);
  } else {
    try {
      saved = await createProfile(await getOrCreateQrId(), input); // QR에 들어가는 그 UUID
    } catch (error) {
      // 이 기기의 ID가 이미 서버에 있는데 토큰이 없는 경우 → 새 ID로 한 번 더
      if (error instanceof ApiError && error.code === "PROFILE_ALREADY_EXISTS") {
        await resetQrId();
        saved = await createProfile(await getOrCreateQrId(), input);
      } else {
        throw error;
      }
    }
  }

  // 사진 반영
  const wanted = profile.photoUri;
  let photoUrl = saved.photoUrl;

  if (!wanted && photoUrl) {
    await deletePhoto();
    photoUrl = null;
  } else if (wanted && wanted !== photoUrl && !/^https?:\/\//i.test(wanted)) {
    // 새로 고른 기기 사진만 업로드 (서버 URL이면 그대로 둠)
    photoUrl = await uploadPhoto(wanted, photoMimeType);
  }

  await AsyncStorage.removeItem(LEGACY_PROFILE_KEY);
  return toMyProfile({ ...saved, photoUrl });
}

/** 개발 테스트용: 이 기기와 프로필의 연결을 끊음 (서버 데이터는 남음) */
export async function deleteMyProfile() {
  await clearOwnerToken();
  await resetQrId();
  await AsyncStorage.removeItem(LEGACY_PROFILE_KEY);
}

/** 서버 연동 전에 기기에만 저장했던 프로필 (작성 화면 미리 채우기용) */
export async function getLegacyLocalProfile(): Promise<MyProfile | null> {
  const stored = await AsyncStorage.getItem(LEGACY_PROFILE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as MyProfile;
  } catch {
    return null;
  }
}
