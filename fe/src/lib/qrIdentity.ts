
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const QR_ID_KEY = "getit_profile_qr_id";

// 같은 앱 실행 중 ID 생성이 중복되지 않도록 관리
let pendingId: Promise<string> | null = null;

export async function getOrCreateQrId(): Promise<string> {
  if (pendingId) return pendingId;

  pendingId = (async () => {
    const existingId = await AsyncStorage.getItem(QR_ID_KEY);

    if (existingId) {
      return existingId;
    }

    // 최초 한 번만 고유 UUID 생성
    const newId = Crypto.randomUUID();

    await AsyncStorage.setItem(QR_ID_KEY, newId);

    return newId;
  })();

  try {
    return await pendingId;
  } finally {
    pendingId = null;
  }
}

// QR 안에 넣을 데이터 형식
export function buildQrValue(id: string): string {
  return `getit:profile:${id}`;
}
