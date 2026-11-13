import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/* ───────────── 설정 ─────────────
   서버 주소를 바꾸고 싶으면 fe/.env 에 EXPO_PUBLIC_API_URL=... 을 넣으면 됨 */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? "https://getit-qr-based-profile.onrender.com"
).replace(/\/+$/, "");

const OWNER_TOKEN_KEY = "getit_owner_token";

// Render 무료 서버는 잠들어 있으면 첫 요청에 30~60초 걸림
const TIMEOUT_MS = 70_000;

/* ───────────── 타입 (백엔드 응답과 동일) ───────────── */

export type ServerProfile = {
  id: string;
  name: string;
  age: number;
  school: string;
  department: string;
  major: string | null;
  studentId: string | null;
  mbti: string | null;
  instagram: string | null;
  clubs: string[];
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProfileInput = {
  name: string;
  age: number;
  school: string;
  department: string;
  major?: string;
  studentId?: string;
  mbti?: string;
  instagram?: string;
  clubs?: string[];
};

export type SavedProfileSummary = {
  savedProfileId: number;
  profileId: string;
  name: string;
  age: number;
  school: string;
  department: string;
  studentId: string | null;
  mbti: string | null;
  photoUrl: string | null;
  honorific: boolean;
};

export type SavedProfileDetail = {
  savedProfileId: number;
  profile: ServerProfile;
  honorific: boolean;
  memo: string | null;
};

/* ───────────── 에러 ───────────── */

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** 화면에 띄울 한국어 메시지 */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "NETWORK_ERROR") {
      return "서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.";
    }
    if (error.code === "TIMEOUT") {
      return "서버 응답이 너무 늦어요. 잠시 후 다시 시도해 주세요.";
    }
    return error.message;
  }
  return "알 수 없는 오류가 발생했어요.";
}

/* ───────────── 토큰 ───────────── */

export async function getOwnerToken(): Promise<string | null> {
  return AsyncStorage.getItem(OWNER_TOKEN_KEY);
}

export async function setOwnerToken(token: string): Promise<void> {
  await AsyncStorage.setItem(OWNER_TOKEN_KEY, token);
}

export async function clearOwnerToken(): Promise<void> {
  await AsyncStorage.removeItem(OWNER_TOKEN_KEY);
}

/* ───────────── 공통 요청 ───────────── */

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean; // true면 X-Owner-Token 헤더를 붙임
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  let payload: BodyInit | undefined;

  if (body instanceof FormData) {
    payload = body; // Content-Type은 fetch가 boundary와 함께 자동 설정
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (auth) {
    const token = await getOwnerToken();
    if (!token) {
      throw new ApiError(401, "UNAUTHORIZED", "먼저 내 프로필을 만들어 주세요.");
    }
    headers["X-Owner-Token"] = token;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: payload,
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new ApiError(0, "TIMEOUT", "서버 응답 시간 초과");
    }
    console.warn(`[api] ${method} ${path} 요청 실패:`, e); // 원인 확인용 (Expo 터미널에 표시됨)
    throw new ApiError(0, "NETWORK_ERROR", "네트워크 오류");
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.code ?? `HTTP_${response.status}`,
      data?.message ?? "요청을 처리하지 못했어요."
    );
  }

  return data as T;
}

/* ───────────── 프로필 API (API_PROFILE.md) ───────────── */

/** 프로필 생성 → 받은 토큰을 기기에 저장 */
export async function createProfile(id: string, input: ProfileInput): Promise<ServerProfile> {
  const res = await request<{ profile: ServerProfile; ownerToken: string }>("/profiles", {
    method: "POST",
    body: { id, ...input },
  });
  await setOwnerToken(res.ownerToken);
  return res.profile;
}

export function getMe(): Promise<ServerProfile> {
  return request<ServerProfile>("/profiles/me", { auth: true });
}

export function updateMe(input: ProfileInput): Promise<ServerProfile> {
  return request<ServerProfile>("/profiles/me", { method: "PUT", body: input, auth: true });
}

/** QR 스캔 후 상대 프로필 미리보기 (토큰 불필요) */
export function getProfileById(id: string): Promise<ServerProfile> {
  return request<ServerProfile>(`/profiles/${encodeURIComponent(id)}`);
}

/** 기기 사진(uri)을 업로드하고 photoUrl 반환 */
export async function uploadPhoto(uri: string, mimeType?: string | null): Promise<string> {
  const type = mimeType || guessMimeType(uri);
  const name = `photo.${type.split("/")[1] === "jpeg" ? "jpg" : type.split("/")[1]}`;
  const form = new FormData();

  if (Platform.OS === "web") {
    // 웹 미리보기: blob: 주소를 실제 파일로 변환해서 fetch로 전송
    const blob = await (await fetch(uri)).blob();
    form.append("file", blob, name);
    const res = await request<{ photoUrl: string }>("/profiles/me/photo", {
      method: "POST",
      body: form,
      auth: true,
    });
    return res.photoUrl;
  }

  // 앱(iOS/Android): Expo SDK 58의 fetch는 { uri } 파일 첨부를 지원하지 않음
  // → React Native의 XMLHttpRequest로 업로드 (기기 파일 경로 첨부를 지원)
  form.append("file", { uri, name, type } as any);
  const res = await xhrRequest<{ photoUrl: string }>("POST", "/profiles/me/photo", form);
  return res.photoUrl;
}

/** XMLHttpRequest 기반 요청 (사진 업로드 전용) */
async function xhrRequest<T>(method: "POST", path: string, body: FormData): Promise<T> {
  const token = await getOwnerToken();
  if (!token) {
    throw new ApiError(401, "UNAUTHORIZED", "먼저 내 프로필을 만들어 주세요.");
  }

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${API_URL}${path}`);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("X-Owner-Token", token);
    xhr.timeout = TIMEOUT_MS;

    xhr.onload = () => {
      let data: any = null;
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        data = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data as T);
      } else {
        reject(
          new ApiError(
            xhr.status,
            data?.code ?? `HTTP_${xhr.status}`,
            data?.message ?? "사진을 올리지 못했어요."
          )
        );
      }
    };
    xhr.onerror = () => reject(new ApiError(0, "NETWORK_ERROR", "네트워크 오류"));
    xhr.ontimeout = () => reject(new ApiError(0, "TIMEOUT", "서버 응답 시간 초과"));

    xhr.send(body);
  });
}

export function deletePhoto(): Promise<void> {
  return request<void>("/profiles/me/photo", { method: "DELETE", auth: true });
}

function guessMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
  return "image/jpeg";
}

/* ───────────── 인맥 관리 API (API.md) ───────────── */

export function saveProfile(targetProfileId: string): Promise<{ savedProfileId: number }> {
  return request("/saved-profiles", {
    method: "POST",
    body: { targetProfileId },
    auth: true,
  });
}

export function getSavedProfiles(search?: string): Promise<SavedProfileSummary[]> {
  const q = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  return request<SavedProfileSummary[]>(`/saved-profiles${q}`, { auth: true });
}

export function getSavedProfile(savedProfileId: number | string): Promise<SavedProfileDetail> {
  return request<SavedProfileDetail>(`/saved-profiles/${savedProfileId}`, { auth: true });
}

export function updateSavedProfile(
  savedProfileId: number | string,
  patch: { honorific?: boolean; memo?: string }
): Promise<{ savedProfileId: number; honorific: boolean; memo: string | null; updatedAt: string }> {
  return request(`/saved-profiles/${savedProfileId}`, {
    method: "PATCH",
    body: patch,
    auth: true,
  });
}
