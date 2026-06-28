# 내부 제작 화면 접근 제어 설계

Status: Draft
Project: homepage
Last Updated: 2026-06-28

---

## 1. 목적

이 문서는 `/internal` 내부 제작 화면과 내부 API의 접근 경계를 정의한다.

현재 프로젝트는 고객용 자유형 빌더나 고객 포털이 아니다. `/internal`은 묵산 내부 제작자가 샘플 홈페이지, 제작 상태, 공지, 상담 문의를 확인하고 조정하는 운영 화면이다.

첫 파일럿 고객 자료를 다루기 전에는 다음 기준이 명확해야 한다.

- 누가 내부 화면에 접근할 수 있는가
- 어떤 API가 공개이고 어떤 API가 내부용인가
- 현재 MVP 접근 키 방식의 한계는 무엇인가
- 운영 secret은 어디에 두고 어떻게 회수하는가
- 고객에게 절대 넘기면 안 되는 권한은 무엇인가

---

## 2. 현재 구현 사실

현재 구현은 전체 로그인·권한 시스템이 아니라 MVP 내부 접근 경계다.

구현 근거:

- backend는 `backend/src/internalAccess.ts`의 `requireInternalAccess` middleware로 내부 API를 보호한다.
- 내부 API는 `Authorization: Bearer <token>` 또는 `x-internal-access-token` 헤더를 읽는다.
- token 비교는 `timingSafeEqual` 기반으로 처리한다.
- 로컬 개발에서 `HOMEPAGE_INTERNAL_ACCESS_TOKEN`이 없으면 `muksan-local-dev`를 사용한다.
- `NODE_ENV=production`에서는 `HOMEPAGE_INTERNAL_ACCESS_TOKEN`이 필수다.
- 운영에서는 개발 기본 키, 공백 키, 32자 미만 키를 거부한다.
- `/api/ready`는 `internal-access-token` readiness check를 포함한다.
- frontend는 `/internal` 진입 시 접근 키 입력 화면을 먼저 보여준다.
- frontend는 접근 키를 `sessionStorage`에만 저장하고, 접근 키 초기화 버튼으로 제거한다.

현재 방식은 파일럿 전 MVP 경계로는 충분하지만, 다중 운영자 계정이나 감사 로그를 제공하지 않는다.

---

## 3. 공개 API와 내부 API

### 3.1 공개 API

토큰 없이 열려 있어야 하는 API:

| API | 목적 | 공개 이유 |
|---|---|---|
| `GET /api/health` | 프로세스 생존 확인 | 운영 health check |
| `GET /api/ready` | 준비 상태 확인 | 배포 전 readiness 확인 |
| `GET /api/academies/:slug` | 공개 홈페이지 콘텐츠 조회 | 학부모 공개 화면 |
| `POST /api/inquiries` | 상담 문의 제출 | 외부 문의 접수 |

주의:

- `GET /api/academies/:slug`는 공개 콘텐츠만 반환해야 한다.
- `POST /api/inquiries`는 개인정보 수집 동의와 입력 검증을 통과해야 한다.
- 상담 문의 목록 조회는 공개 API가 아니다.

### 3.2 내부 API

접근 키가 필요한 API:

| API | 목적 | 보호 이유 |
|---|---|---|
| `GET /api/academies` | 내부 학원 목록 | 제작 상태 포함 |
| `PATCH /api/academies/:slug/status` | 제작 상태 변경 | 운영 상태 변경 |
| `GET /api/academies/:slug/content-checks` | 콘텐츠 점검 | 내부 검수 정보 |
| `GET /api/academies/:slug/notices` | 내부 공지 목록 | 비공개 공지 포함 가능 |
| `POST /api/academies/:slug/notices` | 공지 생성 | 공개 화면 변경 |
| `PATCH /api/notices/:id` | 공지 수정 | 공개 화면 변경 |
| `DELETE /api/notices/:id` | 공지 삭제 | 공개 화면 변경 |
| `GET /api/inquiries` | 상담 문의 목록 | 개인정보 포함 |
| `PATCH /api/inquiries/:id/status` | 문의 상태 변경 | 상담 처리 상태 변경 |

원칙:

- 상담 문의 원문과 연락처가 포함된 API는 항상 내부 API다.
- 제작 상태나 공지 공개 여부를 바꾸는 API는 항상 내부 API다.
- 고객 게시 전 검수 정보는 외부에 노출하지 않는다.

---

## 4. 접근 주체

| 주체 | 접근 가능 여부 | 기준 |
|---|---:|---|
| 묵산 대표 또는 지정 운영자 | 가능 | 운영 secret을 직접 관리할 수 있는 사람 |
| 묵산 내부 제작 보조자 | 조건부 가능 | 파일럿 후 필요 시 별도 절차로 부여 |
| 고객 학원 원장 또는 담당자 | 불가 | 고객 확인 화면은 별도 설계 전까지 제공하지 않음 |
| 학부모와 학생 | 불가 | 공개 홈페이지와 상담 문의만 사용 |
| 외주 개발자 또는 디자이너 | 기본 불가 | 필요 시 임시 키와 작업 범위를 별도 승인 |

현재 MVP에서는 개인별 계정을 만들지 않는다. 따라서 접근 키를 받은 사람은 같은 권한을 가진다.

이 한계 때문에 첫 파일럿 전 접근 키 배포 대상은 최소화한다.

---

## 5. 운영 secret 기준

운영 `HOMEPAGE_INTERNAL_ACCESS_TOKEN` 기준:

- 32자 이상
- 예측 가능한 단어, 학원명, 서비스명, 전화번호 사용 금지
- 저장소, 문서, README, 채팅, 이슈, 커밋 메시지에 실제 값 기록 금지
- Windows Service wrapper 또는 서버 환경 변수에만 설정
- 리허설 키와 운영 키 분리
- 노출 의심 시 즉시 교체

회수 또는 교체가 필요한 경우:

- 작업자가 더 이상 접근할 필요가 없을 때
- 키가 채팅, 문서, 터미널 캡처, 화면 공유에 노출됐을 때
- 고객 파일럿에서 실제 문의가 접수되기 시작할 때
- 운영 서버 접근 권한자가 바뀔 때
- 배포 리허설용 키를 운영에 잘못 사용했을 때

---

## 6. frontend 접근 처리 기준

현재 `/internal`은 접근 키를 입력하기 전에는 내부 데이터를 불러오지 않는다.

운영 기준:

- 내부 접근 키는 `sessionStorage`에만 저장한다.
- 브라우저를 닫거나 접근 키 초기화를 누르면 다시 입력하게 한다.
- 공용 PC 또는 고객 앞 화면 공유 환경에서 접근 키를 입력하지 않는다.
- 화면 공유 중에는 상담 문의 탭을 열지 않는다.
- 고객에게 `/internal` URL을 안내하지 않는다.
- 고객 확인용 화면이 필요하면 별도 `CUSTOMER_REVIEW` 화면을 설계한다.

현재 MVP에서 하지 않을 것:

- 고객 로그인
- 고객 계정
- 고객 포털
- 역할 기반 권한 전체 구현
- magic link
- OAuth
- 고객이 직접 공지나 문구를 수정하는 기능

---

## 7. backend 운영 배치 기준

운영 배치는 다음 원칙을 따른다.

- backend는 기본적으로 `127.0.0.1`에 bind한다.
- public internet에 backend port를 직접 열지 않는다.
- 외부 HTTPS는 Caddy 또는 reverse proxy가 받는다.
- frontend와 backend는 가능하면 same-origin으로 배포한다.
- 다른 origin 배포가 필요하면 `HOMEPAGE_CORS_ORIGINS`에 허용 origin만 명시한다.
- `HOMEPAGE_CORS_ORIGINS=*`는 사용하지 않는다.
- `/api/ready`가 internal access token 설정 오류를 보고하면 배포를 중단한다.

---

## 8. 감사와 기록 한계

현재 MVP는 다음을 제공하지 않는다.

- 개인별 운영자 식별
- 운영자별 권한 분리
- 내부 화면 접속 이력
- 문의 열람 이력
- 공지 수정자 기록
- 제작 상태 변경자 기록

따라서 첫 파일럿 운영에서는 다음 방식으로 보완한다.

- 운영자는 최소 인원으로 제한한다.
- 중요한 변경은 별도 운영 기록에 수동으로 남긴다.
- 상담 문의 원문을 화면 공유하거나 외부 문서에 복사하지 않는다.
- 실제 고객 개인정보는 Git 저장소에 기록하지 않는다.

다중 운영자 또는 실제 고객 수가 늘어나면 다음 단계로 넘어간다.

---

## 9. 단계별 확장 기준

### 9.1 현재 MVP

허용:

- 단일 내부 접근 키
- 내부 제작 화면 접근 키 입력
- 내부 API token 보호
- readiness와 smoke test로 보호 상태 확인

보류:

- 계정
- 역할
- 고객 포털
- 파일 업로드 권한
- 감사 로그

### 9.2 첫 파일럿 운영

추가 기준:

- 운영 키와 리허설 키 분리
- 접근 키 배포 대상 최소화
- 실제 문의 접수 시작 전 키 교체 검토
- 내부 화면 사용 절차 수동 기록
- 고객 확인은 공개 URL 또는 별도 캡처로 진행하고 `/internal`을 공유하지 않음

### 9.3 다중 고객 운영 전

검토할 항목:

- 운영자 계정 도입
- 간단한 server-side session 또는 managed auth
- 역할 분리: 제작자, 검수자, 운영자
- 감사 로그: 문의 열람, 공지 변경, 제작 상태 변경
- 고객 확인 전용 read-only preview route

### 9.4 고객 제한 편집 단계

별도 제품 설계가 필요하다.

허용 가능 후보:

- 대표 색상 선호 선택
- 대표 이미지 후보 선택
- 문구 수정 요청
- 섹션 노출 여부 요청

계속 금지:

- 자유형 드래그앤드롭 빌더
- CSS/HTML/JS 직접 수정
- 고객별 별도 코드베이스
- 검수 없는 즉시 게시

---

## 10. 파일럿 전 GO / NO-GO

GO:

- 운영 `HOMEPAGE_INTERNAL_ACCESS_TOKEN`이 32자 이상이다.
- 실제 token 값이 저장소에 없다.
- `/api/ready`의 `internal-access-token` check가 통과한다.
- `/internal`은 접근 키 없이 내부 데이터를 보여주지 않는다.
- 내부 API는 token 없이 `401`을 반환한다.
- 공개 홈페이지와 상담 문의 제출은 token 없이 동작한다.
- 고객에게 `/internal` URL이나 내부 token을 안내하지 않는다.

NO-GO:

- 운영에서 `muksan-local-dev` 사용
- 실제 token을 README, docs, issue, chat에 기록
- backend port를 public internet에 직접 노출
- 문의 목록 API가 token 없이 열림
- 내부 화면을 고객 확인용 화면으로 공유
- 고객이 내부 제작 상태나 문의 목록에 접근

---

## 11. 현재 구현 보강 여부

현재 코드 기준으로 내부 접근 경계 MVP는 이미 구현되어 있다.

확인된 구현:

- backend 내부 middleware
- production token 설정 방어
- readiness check
- smoke test의 내부 API 보호 확인
- frontend 접근 키 입력 화면
- 접근 키 sessionStorage 저장과 초기화

따라서 지금 단계에서 계정 시스템을 추가하지 않는다.

첫 파일럿 전에는 이 설계 문서를 기준으로 운영 키 발급, 배포 설정, 수동 운영 절차만 점검한다.

---

## 12. 다음 작업

2차 시각 QA 결과는 `docs/21_SECOND_VISUAL_QA_REPORT.md`에 둔다.

자료 누락 체크와 제작 준비도 강화 결과는 `docs/22_MATERIAL_READINESS_ENHANCEMENT_REPORT.md`에 둔다.

파일럿 시연용 로컬 개발 DB 정리 절차는 `docs/23_PILOT_DEMO_LOCAL_DB_CLEANUP_RUNBOOK.md`에 둔다.

다음 1순위는 모바일/데스크톱 브라우저 스크린샷 기반 자동 회귀 테스트를 추가하는 것이다.

범위:

- 공개 홈페이지와 내부 제작 화면의 핵심 뷰를 desktop/mobile viewport로 캡처한다.
- 화면 로드 실패와 주요 문구 미노출을 자동 실패 조건으로 둔다.
- 고객 포털, 고객 계정, 자유 편집기는 계속 보류한다.

이 작업은 고객 기능을 늘리는 것이 아니라, 묵산이 파일럿 시연 전후 같은 화면을 반복 확인하게 만드는 작업이다.
