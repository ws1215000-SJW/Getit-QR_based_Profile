# 데이터베이스 명세서

- **DBMS:** PostgreSQL (Supabase 무료 플랜, 서울 리전)
- **생성 방식:** Spring Data JPA 엔티티 기준으로 자동 생성 (`ddl-auto: update`)
- **엔티티 코드:** `be/src/main/java/com/getit/qrprofile/domain/*/entity/`
- **작성:** 김수아

## ERD

```
profiles (1) ──< saved_profiles >── (1) profiles
   id  ◄─────── owner_id   (저장한 사람 = 나)
   id  ◄─────── target_id  (저장된 사람 = QR 찍힌 상대)
```

한 사람은 여러 명을 저장할 수 있고(owner), 여러 사람에게 저장될 수 있다(target).

## 테이블 목록

| 테이블 | 설명 | 담당 API |
|---|---|---|
| `profiles` | 사용자 본인의 프로필. 로그인 대신 `owner_token`으로 본인 확인 | `/profiles` (김수아) |
| `saved_profiles` | "누가 누구를 QR로 저장했는지" 관계 + 존댓말·메모 | `/saved-profiles` (오지수) |

## 1. `profiles` — 내 프로필

| 컬럼 | 타입 | NULL | 기본값 | 제약 | 설명 |
|---|---|---|---|---|---|
| `id` | `uuid` | N | | **PK** | 프로필 고유 ID. 앱 최초 실행 시 생성한 UUID. QR 값 `getit:profile:{id}`에 들어감 (**공개되는 값**) |
| `owner_token` | `varchar(64)` | N | | UNIQUE | 본인 확인용 비밀값. 프로필 생성 시 서버가 발급. 요청 헤더 `X-Owner-Token`과 비교 (**응답에 노출 금지**) |
| `name` | `varchar(30)` | N | | | 이름 |
| `age` | `integer` | N | | | 나이 |
| `school` | `varchar(50)` | N | | | 학교 |
| `department` | `varchar(50)` | N | | | 학과 |
| `major` | `varchar(50)` | Y | | | 전공 (프론트 작성 화면 반영 여부 확인 필요) |
| `student_id` | `varchar(20)` | Y | | | 학번. 예: `21학번` |
| `mbti` | `varchar(4)` | Y | | | MBTI. 예: `ENFP` |
| `instagram` | `varchar(30)` | Y | | | 인스타 아이디 |
| `clubs` | `text[]` | Y | `{}` | | 동아리 목록 (여러 개 가능) |
| `photo_url` | `varchar(500)` | Y | | | 프로필 사진 URL (Supabase Storage) |
| `created_at` | `timestamp` | N | 자동 | | 생성 시각 |
| `updated_at` | `timestamp` | N | 자동 | | 마지막 수정 시각 |

## 2. `saved_profiles` — 저장한 프로필(인맥) 관계

| 컬럼 | 타입 | NULL | 기본값 | 제약 | 설명 |
|---|---|---|---|---|---|
| `id` | `bigint` | N | 자동 증가 | **PK** | API의 `savedProfileId` |
| `owner_id` | `uuid` | N | | **FK** → `profiles.id`, ON DELETE CASCADE | 저장한 사람 (헤더 토큰으로 찾은 "나") |
| `target_id` | `uuid` | N | | **FK** → `profiles.id`, ON DELETE CASCADE | 저장된 사람 (API의 `targetProfileId`) |
| `honorific` | `boolean` | N | `false` | | 존댓말 사용 여부 |
| `memo` | `varchar(200)` | Y | `''` | | 나만 보는 메모 (최대 200자, 프론트 제한과 동일) |
| `created_at` | `timestamp` | N | 자동 | | 저장한 시각 (목록 정렬 기준) |
| `updated_at` | `timestamp` | N | 자동 | | 마지막 수정 시각 (PATCH 응답의 `updatedAt`) |

**제약 조건**
- `uk_saved_owner_target` UNIQUE (`owner_id`, `target_id`): 같은 사람을 두 번 저장할 수 없음 → API `ALREADY_SAVED` (409)
- `owner_id = target_id`(자기 자신 저장)는 DB가 아니라 서비스 코드에서 막음 → API `CANNOT_SAVE_SELF` (400)

## 설계 결정

1. **상대 정보는 복사하지 않고 `target_id`로 참조한다.**
   상대가 프로필을 수정하면 내 저장 목록에도 최신 정보가 보인다. 목록·상세 조회는 `saved_profiles`와 `profiles`를 JOIN해서 응답을 만든다.
2. **로그인 대신 `owner_token`으로 본인을 확인한다.**
   QR의 UUID는 누구나 볼 수 있으므로, UUID만으로는 수정·저장 권한을 주지 않는다. "나"가 필요한 모든 요청은 `X-Owner-Token` 헤더 → `profiles.owner_token`으로 조회한다.
3. **프로필이 삭제되면 관련 저장 관계도 함께 삭제된다** (`ON DELETE CASCADE`).

## API ↔ DB 컬럼 매핑

| API 필드 (JSON) | DB 컬럼 |
|---|---|
| `savedProfileId` | `saved_profiles.id` |
| `targetProfileId` | `saved_profiles.target_id` |
| `honorific` | `saved_profiles.honorific` |
| `memo` | `saved_profiles.memo` |
| `updatedAt` | `saved_profiles.updated_at` |
| `name`, `age`, `school`, `department`, `major`, `mbti`, `instagram`, `clubs` | `profiles` 같은 이름의 컬럼 |
| `studentId` | `profiles.student_id` |
| `photoUrl` | `profiles.photo_url` |

## 검색 (`GET /saved-profiles?search=`)

`target`의 `name`, `school`, `department`에 대해 부분 일치(대소문자 무시)로 검색한다. 인원이 적어 별도 인덱스는 두지 않는다.
