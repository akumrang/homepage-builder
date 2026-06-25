# Muksan Homepage Project

묵산 SaaS의 세 번째 축인 학원 홈페이지 제작·관리 프로젝트입니다.

이 프로젝트는 고객에게 홈페이지 제작툴을 판매하는 것이 아니라, 묵산 SaaS 구독 학원에게 학원당 1개의 고품질 홈페이지를 제작·제공하고, 이를 상담·공지·결제·학원관리·시험지 생성관리와 연결하는 외부 접점 시스템을 목표로 합니다.

## 제품 정의

묵산 homepage 프로젝트는 구독 학원마다 개별 완성 홈페이지를 제공하되, 이를 공통 템플릿·학원별 콘텐츠 데이터·묵산 내부 제작 화면으로 반복 생산하고 운영하기 위한 플랫폼입니다.

고객은 자유형 홈페이지 빌더를 사용하는 것이 아니라, 묵산이 미리 준비한 완성형 샘플과 템플릿 방향을 보고 선호 유형을 선택합니다. 이후 묵산 내부 제작자가 학원 자료를 받아 콘텐츠를 구성하고, 검수와 고객 확인을 거쳐 게시합니다.

고객은 자기 학원의 얼굴에 대한 미학적 표현 권리를 가지지만, 그 권리는 묵산의 표준 템플릿, 디자인 토큰, 검수 절차, 운영 가능 범위 안에서 행사됩니다.

기본 제작 흐름:

```text
완성형 샘플 확인
→ 고객의 선호 방향 선택
→ 학원 자료 수집
→ 묵산 내부 제작
→ 묵산 검수
→ 고객 확인
→ 게시
→ 상담·공지·결제·학원관리 연결
```

고객이 선택하는 것은 홈페이지의 방향입니다. 레이아웃을 자유롭게 편집하거나, 디자인 시스템을 깨는 방식으로 직접 제작하는 것은 이 프로젝트의 범위가 아닙니다.

## MVP 상태

첫 구현은 샘플 학원 데이터를 기반으로 `trust-basic-v1` 템플릿 1종을 렌더링하고, 상담 문의를 backend로 접수하는 최소 구조입니다.

체크리스트 기준 구현 상태는 `docs/MVP_IMPLEMENTATION_STATUS.md`에 정리되어 있습니다.

포함된 것:

- `frontend`: Vite + React + TypeScript
- `backend`: Express + TypeScript
- `shared`: frontend/backend 공통 상담 문의 검증 규칙
- 샘플 학원 데이터: `sample-korean-academy`
- 샘플 공개 콘텐츠 seed JSON: `backend/content/sample-academies.json`
- 공개 홈페이지: `/h/sample-korean-academy`
- 내부 제작 화면: `/internal`
- 상담 문의 Prisma 저장소
- 공지사항 Prisma 저장소와 내부 최소 CRUD
- 홈페이지 제작 상태 Prisma 저장소와 내부 상태 변경
- 내부 제작 화면 탭 구조: 상태 / 콘텐츠 / 공지 / 문의
- 로컬 개발 DB: `backend/data/homepage-dev.db`

포함하지 않은 것:

- academy 실제 연동
- exam_system2 실제 연동
- 실제 결제 또는 PG 연동
- OpenAI API 실제 연결
- 로그인과 권한 전체 구현
- 고객용 자유형 홈페이지 빌더
- 커스텀 도메인 연결

## 실행 방법

PowerShell에서 `npm`이 실행 정책에 막히는 경우가 있어 Windows PowerShell 기준 명령은 `npm.cmd`로 적었습니다.

```powershell
npm.cmd install
```

backend 실행:

```powershell
npm.cmd run dev:backend
```

`dev:backend`는 Prisma Client를 생성하고, 서버 시작 시 SQLite 개발 DB의 홈페이지 상태, 공지사항, 상담 문의 테이블을 보장합니다.

frontend 실행:

```powershell
npm.cmd run dev:frontend
```

기본 포트:

| 영역 | URL |
|---|---|
| frontend | http://127.0.0.1:5175 |
| backend | http://localhost:4200 |

확인 URL:

- 공개 홈페이지: http://127.0.0.1:5175/h/sample-korean-academy
- 내부 제작 화면: http://127.0.0.1:5175/internal
- backend health: http://localhost:4200/api/health

## 검증 명령

```powershell
npm.cmd run verify
```

`verify`는 shared 검증 규칙 smoke test, 콘텐츠 검증, backend API smoke test, TypeScript 타입 검사, production build를 순서대로 실행하는 최종 검증 명령입니다.

각 단계를 따로 실행하려면 다음 명령을 사용할 수 있습니다.

```powershell
npm.cmd run shared:smoke
npm.cmd run content:validate
npm.cmd run api:smoke
npm.cmd run typecheck
npm.cmd run build
```

`shared:smoke`는 frontend/backend가 함께 쓰는 상담 문의 검증 규칙의 정상/실패 케이스를 빠르게 확인합니다.

`content:validate`는 `backend/content/sample-academies.json`의 필수 구조와 공개 콘텐츠 필수 항목을 확인합니다. `typecheck`와 `build`는 backend 검증 단계에서 이 명령을 먼저 실행하므로 seed 콘텐츠가 깨지면 TypeScript 컴파일 전에 실패합니다.

`api:smoke`는 backend 앱을 임시 포트로 실행해 `health`, 콘텐츠 점검 API, 홈페이지 제작 상태 변경, 잘못된 제작 상태 차단, 공지사항 생성·수정·삭제, 공지 공개/비공개 노출, 상담 문의 정상 접수, 문의 상태 변경, 잘못된 문의 상태 차단, 개인정보 미동의 차단을 실제 HTTP 요청으로 검증합니다. 테스트 중 변경한 홈페이지 상태는 원래 값으로 되돌리고, 생성한 공지사항과 상담 문의는 검증 종료 시 삭제합니다.

Prisma SQLite DB만 수동으로 준비하려면 다음 명령을 사용합니다.

```powershell
npm.cmd --workspace backend run db:init
```

## API

```text
GET  /api/health
GET  /api/academies
GET  /api/academies/:slug
PATCH /api/academies/:slug/status
GET  /api/academies/:slug/content-checks
GET  /api/academies/:slug/notices
POST /api/academies/:slug/notices
GET  /api/inquiries
POST /api/inquiries
PATCH /api/inquiries/:id/status
PATCH /api/notices/:id
DELETE /api/notices/:id
```

상담 문의 필수 항목:

- 보호자 이름
- 연락처
- 학생 학년
- 관심 과목
- 문의 내용
- 개인정보 수집 동의

개인정보 수집 동의가 없거나, 휴대전화 번호 형식이 맞지 않거나, 문의 내용이 10자 미만이면 backend가 `400`을 반환합니다.

공개 홈페이지 상담 폼은 제출 전에 휴대전화 번호 형식, 문의 내용 10자 이상, 개인정보 수집·이용 동의 여부를 클라이언트에서 먼저 확인합니다.

상담 문의 검증 규칙은 `shared` workspace에서 관리하며, frontend와 backend가 같은 모듈을 사용합니다.

내부 제작 화면에서는 상담 문의를 `NEW`와 `CHECKED` 상태로 표시하고, 확인 처리 또는 되돌리기를 할 수 있습니다. 문의 목록은 상태, 학년, 과목, 검색어로 필터링할 수 있습니다.

공지사항은 내부 제작 화면에서 제목, 날짜, 내용, 중요 여부, 공개 여부를 관리합니다. 공지 목록은 공개 상태, 중요 여부, 검색어로 필터링할 수 있습니다. 공개 홈페이지에는 공개 상태의 공지만 표시됩니다.

홈페이지 제작 상태는 내부 제작 화면의 샘플 학원 카드에서 변경할 수 있으며, 상태 값은 `REQUESTED`, `WAITING_FOR_MATERIALS`, `MATERIALS_READY`, `DRAFT_CREATED`, `INTERNAL_REVIEW`, `CUSTOMER_REVIEW`, `APPROVED`, `PUBLISHED` 중 하나입니다.

내부 제작 화면은 `상태`, `콘텐츠`, `공지`, `문의` 탭으로 나누어 운영자가 필요한 관리 영역만 확인하도록 구성합니다.

`콘텐츠` 탭은 seed JSON에서 읽힌 공개 콘텐츠의 핵심값을 빠르게 검수합니다. 현재 점검 항목은 학원명, 대표 문구, 대상 학년, 대표 과목, 연락처, 주소, 강사진 수, 커리큘럼 수, 수업 안내 수, 공개 공지 수입니다.

seed JSON은 backend의 콘텐츠 검증 모듈을 통과해야 로드됩니다. 내부 `콘텐츠` 탭도 같은 검증 결과 API를 사용하므로 로더와 운영 화면의 기준이 분리되지 않습니다.

## 프로젝트 원칙

- 고객별 별도 코드베이스를 만들지 않습니다.
- 고객용 자유형 빌더를 만들지 않습니다.
- academy와 exam_system2의 DB를 직접 공유하지 않습니다.
- 실제 학생 개인정보, 학부모 연락처, 결제 정보를 사용하지 않습니다.
- 허위 실적, 허위 후기, 허위 강사 경력을 표시하지 않습니다.
- 기능은 작게 시작하되 공개 홈페이지는 실제 상품처럼 보이게 만듭니다.
