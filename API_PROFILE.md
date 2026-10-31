# 프로필 API 명세서 (`profiles`)

작성: 김수아 · 인맥 관리 API는 `API.md`(오지수) 참고

## 공통 사항

- **본인 확인 헤더:** `X-Owner-Token: {ownerToken}`
  - 프로필 생성(`POST /profiles`) 응답으로 **한 번만** 발급됨 → 앱이 AsyncStorage에 저장해서 이후 모든 "나" 관련 요청에 사용
  - 토큰이 없거나 틀리면 `UNAUTHORIZED` (401)
- **프로필 ID:** 앱이 최초 실행 시 만든 UUID (`fe/src/lib/qrIdentity.ts`). QR 값 `getit:profile:{id}`의 `{id}` 부분
- **공통 에러 응답:**

```json
{
  "code": "ERROR_CODE",
  "message": "에러 메시지"
}
```

## API 목록

| 메서드 | 경로 | 기능 | 요청 데이터 | 성공 응답 | 주요 에러 코드 |
|---|---|---|---|---|---|
| POST | `/profiles` | 내 프로필 생성 (최초 1회) + 토큰 발급 | Body: 프로필 정보 + `id` | `201 Created`<br>`{"profile": {...}, "ownerToken": "..."}` | `INVALID_INPUT` (400)<br>`PROFILE_ALREADY_EXISTS` (409) |
| GET | `/profiles/me` | 내 프로필 조회 | Header: `X-Owner-Token` | `200 OK`<br>프로필 객체 | `UNAUTHORIZED` (401) |
| PUT | `/profiles/me` | 내 프로필 수정 | Header: `X-Owner-Token`<br>Body: 프로필 정보 | `200 OK`<br>수정된 프로필 객체 | `INVALID_INPUT` (400)<br>`UNAUTHORIZED` (401) |
| GET | `/profiles/{id}` | QR 스캔 후 상대 프로필 조회 | 없음 (토큰 불필요) | `200 OK`<br>프로필 객체 | `INVALID_INPUT` (400)<br>`PROFILE_NOT_FOUND` (404) |
| POST | `/profiles/me/photo` | 프로필 사진 업로드 (교체) | Header: `X-Owner-Token`<br>`multipart/form-data` (`file`) | `200 OK`<br>`{"photoUrl": "..."}` | `INVALID_FILE` (400)<br>`FILE_TOO_LARGE` (400)<br>`UNAUTHORIZED` (401)<br>`STORAGE_ERROR` (502) |
| DELETE | `/profiles/me/photo` | 프로필 사진 삭제 | Header: `X-Owner-Token` | `204 No Content` | `UNAUTHORIZED` (401) |

## 프로필 객체 (모든 응답 공통)

`ownerToken`은 포함되지 않는다. 오지수 님 `GET /saved-profiles/{id}` 응답의 `"profile"`도 같은 형식.

```json
{
  "id": "3f2c1a9e-8b7d-4c6e-9f1a-2b3c4d5e6f70",
  "name": "김수아",
  "age": 22,
  "school": "경북대학교",
  "department": "컴퓨터학부",
  "major": null,
  "studentId": "23학번",
  "mbti": "INFJ",
  "instagram": "sua.zip",
  "clubs": ["겟잇", "밴드부"],
  "photoUrl": null,
  "createdAt": "2026-10-31T19:30:00",
  "updatedAt": "2026-10-31T19:30:00"
}
```

## 입력 규칙

| 필드 | 필수 | 규칙 |
|---|---|---|
| `id` | O (생성 시만) | UUID 형식 |
| `name` | O | 최대 30자 |
| `age` | O | 1~150 숫자 (프론트에서 문자열이면 숫자로 변환해서 보내기) |
| `school` | O | 최대 50자 |
| `department` | O | 최대 50자 |
| `major` | | 최대 50자 |
| `studentId` | | 최대 20자. 예: `23학번` |
| `mbti` | | 4글자 MBTI. 소문자로 보내도 대문자로 저장 |
| `instagram` | | 최대 30자. `@`를 붙여 보내도 떼고 저장 |
| `clubs` | | 문자열 배열, 최대 10개. 빈 값·중복은 제거 |

선택 항목은 빈 문자열(`""`)로 보내면 `null`로 저장된다.

## 상세 요청 및 응답

### 1. POST `/profiles` — 내 프로필 생성

**Request Body**
```json
{
  "id": "3f2c1a9e-8b7d-4c6e-9f1a-2b3c4d5e6f70",
  "name": "김수아",
  "age": 22,
  "school": "경북대학교",
  "department": "컴퓨터학부",
  "studentId": "23학번",
  "mbti": "INFJ",
  "instagram": "@sua.zip",
  "clubs": ["겟잇", "밴드부"]
}
```

**Response (201 Created)**
```json
{
  "profile": { "...": "프로필 객체" },
  "ownerToken": "kq3N0x...(43자)"
}
```

> ⚠️ `ownerToken`은 다시 받을 방법이 없다. 앱을 지우면 토큰도 사라지므로 해당 프로필은 더 이상 수정할 수 없다 (MVP 범위에서 허용, "기기 변경 후 불러오기"는 Should).

### 2. GET `/profiles/me` — 내 프로필 조회

**Request Header**
```
X-Owner-Token: kq3N0x...
```

**Response (200 OK):** 프로필 객체

### 3. PUT `/profiles/me` — 내 프로필 수정

**전체 덮어쓰기** 방식이다. 선택 항목을 빼고 보내면 그 항목은 비워진다. 프로필 작성 화면의 값을 전부 보내면 된다. `id`와 사진은 바뀌지 않는다.

**Request Body**
```json
{
  "name": "김수아",
  "age": 23,
  "school": "경북대학교",
  "department": "컴퓨터학부",
  "studentId": "23학번",
  "mbti": "INFJ",
  "instagram": "sua.zip",
  "clubs": ["겟잇"]
}
```

**Response (200 OK):** 수정된 프로필 객체

### 4. GET `/profiles/{id}` — 상대 프로필 조회 (QR 스캔)

QR에서 읽은 `getit:profile:{id}`의 `{id}`로 호출한다. 저장하기 전에 "이 사람이 맞는지" 보여주는 용도. 저장은 `POST /saved-profiles` (API.md).

**Response (200 OK):** 프로필 객체

### 5. POST `/profiles/me/photo` — 프로필 사진 업로드

- `multipart/form-data`, 필드 이름 `file`
- 형식: jpg, png, webp, heic · 최대 5MB
- 사진이 이미 있으면 새 사진으로 교체되고 이전 사진은 저장소에서 삭제됨
- 프로필을 먼저 생성한 뒤(토큰을 받은 뒤) 호출해야 함

**Response (200 OK)**
```json
{
  "photoUrl": "https://{프로젝트}.supabase.co/storage/v1/object/public/profile-photos/{프로필ID}/{파일}.jpg"
}
```

**프론트 예시 (Expo, expo-image-picker 결과 사용)**
```js
const form = new FormData();
form.append("file", { uri: asset.uri, name: "photo.jpg", type: asset.mimeType ?? "image/jpeg" });

const res = await fetch(`${API_URL}/profiles/me/photo`, {
  method: "POST",
  headers: { "X-Owner-Token": ownerToken }, // Content-Type은 직접 넣지 말 것 (자동 설정)
  body: form,
});
const { photoUrl } = await res.json();
```

### 6. DELETE `/profiles/me/photo` — 프로필 사진 삭제

`photoUrl`이 `null`이 되고 저장소의 파일도 삭제된다. 사진이 없을 때 호출해도 `204`.

## 프론트 연결 흐름

```
앱 첫 실행 → getOrCreateQrId()로 UUID 생성
  → 프로필 작성 → POST /profiles (id + 입력값)
  → 응답의 ownerToken을 AsyncStorage에 저장
  → (사진을 골랐다면) POST /profiles/me/photo
  → 이후: GET/PUT /profiles/me, /saved-profiles/* 요청에 X-Owner-Token 헤더 첨부

QR 스캔 → GET /profiles/{id}로 미리보기 → POST /saved-profiles로 저장
```
