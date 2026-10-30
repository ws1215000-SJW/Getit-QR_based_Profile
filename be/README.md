# Getit Backend

Spring Boot 3.5 · Java 17+ · Spring Data JPA · PostgreSQL (Supabase)

## 처음 실행하기

1. **JDK 17 이상** 설치 확인: 터미널에 `java -version`
2. `be/.env.example`을 복사해서 같은 폴더에 `.env`로 저장하고 Supabase DB 정보를 채운다
   (`.env`는 깃허브에 올라가지 않음. 비밀번호는 팀원끼리 따로 공유)
3. `be` 폴더에서 실행
   ```
   # Windows
   gradlew.bat bootRun
   # Mac / Linux
   ./gradlew bootRun
   ```
4. 브라우저에서 http://localhost:8080/health → `{"status":"ok"}` 나오면 성공
   (서버가 뜨면서 `profiles`, `saved_profiles` 테이블이 Supabase에 자동 생성됨)

## 폴더 구조

```
src/main/java/com/getit/qrprofile
├── QrProfileApplication.java
├── domain
│   ├── profile          ← 김수아: 내 프로필 생성·조회·수정, 사진 업로드
│   │   ├── controller / service / dto
│   │   ├── entity/Profile.java
│   │   └── repository/ProfileRepository.java
│   └── savedprofile     ← 오지수: QR로 저장, 목록·검색, 존댓말·메모
│       ├── controller / service / dto
│       ├── entity/SavedProfile.java
│       └── repository/SavedProfileRepository.java
└── global
    ├── common     BaseTimeEntity(created_at/updated_at), HealthController
    ├── config     CorsConfig
    └── exception  ErrorCode, CustomException, GlobalExceptionHandler
```

## DB 테이블 (요약)

**profiles** — 내 프로필
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | uuid PK | QR에 들어가는 값 (`getit:profile:{id}`), 공개됨 |
| owner_token | varchar(64) unique | 본인 확인용 비밀값, 응답에 노출 금지 |
| name, school, department | varchar not null | 필수 |
| age | int not null | 필수 |
| major, student_id, mbti, instagram | varchar | 선택 |
| clubs | text[] | 동아리 여러 개 |
| photo_url | varchar(500) | Supabase Storage URL |
| created_at, updated_at | timestamp | 자동 |

**saved_profiles** — QR로 저장한 관계
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | bigint PK | 자동 증가 |
| owner_id | uuid FK → profiles | 저장한 사람 |
| target_id | uuid FK → profiles | 저장된 사람 |
| honorific | boolean default false | 존댓말 여부 |
| memo | varchar(200) | 나만 보는 메모 |
| created_at, updated_at | timestamp | 자동 |
| | unique(owner_id, target_id) | 중복 저장 방지 |

상대 정보는 복사하지 않고 `target_id`로 참조한다. 프로필이 삭제되면 관련 저장 관계도 같이 삭제된다.

## 본인 확인 방식 (로그인 없음)

- 프로필 생성 시 서버가 `ownerToken`을 발급해 응답으로 한 번만 돌려준다 → 앱이 AsyncStorage에 저장
- 이후 "나"가 필요한 요청(내 프로필 수정, 프로필 저장, 내 목록 조회 등)은 헤더에 토큰을 담아 보낸다
  `X-Owner-Token: {ownerToken}` (헤더 이름은 API 명세서에서 최종 확정)
- QR의 UUID는 누구나 볼 수 있으므로 UUID만으로는 수정 권한을 주지 않는다

## 협업 규칙

- `main`에 직접 push 하지 않고 `feature/be-xxx` 브랜치 → PR
- 엔티티(테이블) 구조를 바꿀 때는 서로 먼저 공유하기
- 개발 중에는 `ddl-auto: update`라 컬럼 추가는 자동 반영되지만, 컬럼 삭제·이름 변경은 Supabase에서 직접 정리해야 함
