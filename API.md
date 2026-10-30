# 인맥 관리 API 명세서 (`saved-profiles`)

## 공통 사항

- **기본 헤더:** `X-Owner-Token: {ownerToken}` (본인 확인용 비밀값)
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
| POST | `/saved-profiles` | 상대방 프로필 저장 (QR 스캔) | Header: `X-Owner-Token`<br>Body: `{"targetProfileId": "UUID"}` | `201 Created`<br>`{"savedProfileId": 1, "message": "저장 완료"}` | `CANNOT_SAVE_SELF` (400)<br>`PROFILE_NOT_FOUND` (404)<br>`ALREADY_SAVED` (409) |
| GET | `/saved-profiles` | 저장 목록 조회 및 검색 | Header: `X-Owner-Token`<br>Query: `search` | `200 OK`<br>저장된 프로필 목록 반환 | `UNAUTHORIZED` (401) |
| GET | `/saved-profiles/{id}` | 저장한 상대방의 상세 정보 조회 | Header: `X-Owner-Token` | `200 OK`<br>`{"savedProfileId": 1, "profile": {...}, "honorific": true, "memo": "메모 내용"}` | `SAVED_PROFILE_NOT_FOUND` (404)<br>`UNAUTHORIZED` (401) |
| PATCH | `/saved-profiles/{id}` | 존댓말 설정 및 메모 수정 | Header: `X-Owner-Token`<br>Body: `{"honorific": false, "memo": "수정할 메모"}` | `200 OK`<br>`{"savedProfileId": 1, "honorific": false, "memo": "...", "updatedAt": "..."}` | `INVALID_INPUT` (400)<br>`SAVED_PROFILE_NOT_FOUND` (404) |

## 상세 요청 및 응답

### 1. POST `/saved-profiles` — 상대방 프로필 저장

**Request Body**
```json
{
  "targetProfileId": "UUID"
}
```

**Response (201 Created)**
```json
{
  "savedProfileId": 1,
  "message": "저장 완료"
}
```

### 2. GET `/saved-profiles` — 저장 목록 조회

**Query Parameters**

| 파라미터 | 설명 | 예시 |
|---|---|---|
| `search` | 이름, 학교, 학과 검색 | `?search=김서연` |


**Response (200 OK)**
```json
[
  {
    "savedProfileId": 1,
    "name": "김서연",
    "school": "연세대",
    "age": 22,
    "department": "시디과",
    "studentId": "21학번",
    "mbti": "ENFP",
    "photoUrl": "...",
    "honorific": true
  }
]
```

### 3. GET `/saved-profiles/{id}` — 상대방 상세 정보 조회

**Response (200 OK)**
```json
{
  "savedProfileId": 1,
  "profile": {
    "...": "전체 프로필 정보"
  },
  "honorific": true,
  "memo": "메모 내용"
}
```

### 4. PATCH `/saved-profiles/{id}` — 존댓말 설정 및 메모 수정

**Request Body**
```json
{
  "honorific": false,
  "memo": "수정할 메모"
}
```

두 필드는 선택적으로 전달할 수 있으며, 전달한 필드만 수정.

**Response (200 OK)**
```json
{
  "savedProfileId": 1,
  "honorific": false,
  "memo": "수정할 메모",
  "updatedAt": "2026-10-30T12:00:00"
}
```
