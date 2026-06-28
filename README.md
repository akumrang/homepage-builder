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
공개 홈페이지 1차 시각 QA 결과는 `docs/11_PUBLIC_HOMEPAGE_VISUAL_QA_REPORT.md`에 정리되어 있습니다.
샘플 화면과 실제 고객 게시 화면의 문구, asset, footer 분리 기준은 `docs/12_PUBLICATION_MODE_POLICY.md`에 정리되어 있습니다.

첫 고객 파일럿을 위한 홈페이지 자료 수집 양식과 현재 seed 구조 매핑은 `planning/13_CUSTOMER_HOMEPAGE_INTAKE_SCHEMA.md`에 정리되어 있습니다.
자료 수집 전체 API와 내부 입력 화면 구현 여부 판단은 `docs/13_CUSTOMER_INTAKE_IMPLEMENTATION_DECISION.md`에 정리되어 있습니다.
첫 파일럿에서 고객에게 보낼 자료 요청 패킷은 `docs/14_FIRST_PILOT_CUSTOMER_INTAKE_PACKET.md`에 정리되어 있습니다.
첫 파일럿 자료 수집 리허설과 누락 항목 기록은 `docs/15_FIRST_PILOT_INTAKE_REHEARSAL.md`에 정리되어 있습니다.
첫 파일럿 자료 요청 패킷의 실고객 발송 전 최종 검토는 `docs/16_FIRST_PILOT_INTAKE_PACKET_FINAL_REVIEW.md`에 정리되어 있습니다.
첫 파일럿 고객별 발송용 자료 요청 사본 템플릿은 `docs/17_FIRST_PILOT_CUSTOMER_SEND_COPY.md`에 정리되어 있습니다.
첫 파일럿 자료 회신 후 접수 기록 양식은 `docs/18_FIRST_PILOT_INTAKE_RECEIPT_RECORD_TEMPLATE.md`에 정리되어 있습니다.
첫 파일럿 자료 접수 가상 판정 예시는 `docs/19_FIRST_PILOT_INTAKE_RECEIPT_REHEARSAL.md`에 정리되어 있습니다.
내부 제작 화면 접근 제어 설계는 `docs/20_INTERNAL_DASHBOARD_ACCESS_CONTROL_PLAN.md`에 정리되어 있습니다.
2차 시각 QA 결과는 `docs/21_SECOND_VISUAL_QA_REPORT.md`에 정리되어 있습니다.
자료 누락 체크와 제작 준비도 강화 결과는 `docs/22_MATERIAL_READINESS_ENHANCEMENT_REPORT.md`에 정리되어 있습니다.
파일럿 시연용 로컬 개발 DB 정리 절차는 `docs/23_PILOT_DEMO_LOCAL_DB_CLEANUP_RUNBOOK.md`에 정리되어 있습니다.
브라우저 스크린샷 회귀 테스트 결과는 `docs/24_SCREENSHOT_REGRESSION_TEST_REPORT.md`에 정리되어 있습니다.

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

로컬 개발에서 `DATABASE_URL`을 지정하지 않으면 backend는 다음 SQLite DB를 기본값으로 사용합니다.

```text
file:../data/homepage-dev.db
```

backend 환경 변수 예시는 `backend/.env.example`에 있습니다.

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
- backend readiness: http://localhost:4200/api/ready

로컬 내부 제작 화면 접근 키:

```text
muksan-local-dev
```

backend의 내부 API는 `Authorization: Bearer <token>` 헤더를 요구합니다. 로컬 개발에서는 `HOMEPAGE_INTERNAL_ACCESS_TOKEN`이 없으면 위 기본 키를 사용합니다.

`NODE_ENV=production`에서는 내부 접근 키가 반드시 필요하며, 개발 기본 키 `muksan-local-dev`, 공백 키, 32자 미만 키는 거부됩니다.

PowerShell에서 내부 접근 키를 바꾸려면 backend 실행 전에 다음처럼 설정합니다.

```powershell
$env:HOMEPAGE_INTERNAL_ACCESS_TOKEN="원하는-로컬-내부-접근-키"
npm.cmd run dev:backend
```

이 접근 키는 MVP 단계의 내부 접근 경계이며, 운영용 로그인·권한 시스템이 아닙니다.

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

`api:smoke`는 backend 앱을 임시 포트로 실행해 `health`, `readiness`, 내부 접근 토큰 설정 방어, 내부 API 접근 보호, 콘텐츠 점검 API, 홈페이지 제작 상태 변경, 잘못된 제작 상태 차단, 공지사항 생성·수정·삭제, 공지 공개/비공개 노출, 상담 문의 정상 접수, 문의 상태 변경, 잘못된 문의 상태 차단, 개인정보 미동의 차단을 실제 HTTP 요청으로 검증합니다. 테스트 중 변경한 홈페이지 상태는 원래 값으로 되돌리고, 생성한 공지사항과 상담 문의는 검증 종료 시 삭제합니다.

브라우저 스크린샷 회귀 테스트는 별도 명령으로 실행합니다.

최초 1회 Playwright Chromium이 없으면 다음 명령을 실행합니다.

```powershell
npx.cmd playwright install chromium
```

이후 다음 명령으로 production build, 임시 SQLite DB, same-origin frontend dist server를 띄워 공개 홈페이지와 내부 제작 화면의 desktop/mobile 캡처를 생성합니다.

```powershell
npm.cmd run visual:regression
```

산출물은 `.tmp/visual-regression/<timestamp>/` 아래에 생성되며 Git에 커밋하지 않습니다.

Prisma SQLite 개발 DB만 수동으로 준비하려면 다음 명령을 사용합니다.

```powershell
npm.cmd run db:init
```

`db:init`은 로컬 개발용 명령입니다. Prisma Client를 생성하고 `prisma db push`로 개발 DB 구조를 맞춘 뒤 샘플 홈페이지 상태와 공지 seed를 보장합니다.

운영 또는 배포 환경에서는 migration을 명시적으로 적용합니다.

Windows 운영 배포 첫 실행 순서는 `docs/10_WINDOWS_DEPLOYMENT_QUICKSTART.md`에 정리되어 있습니다.
운영 배포 전 상세 점검 기준은 `docs/01_OPERATION_READINESS_CHECKLIST.md`에 정리되어 있습니다.
SQLite 백업/복구 절차는 `docs/02_SQLITE_BACKUP_RESTORE_RUNBOOK.md`에 정리되어 있습니다.
파일럿 시연 전 로컬 개발 DB를 깨끗한 테스트 상태로 정리하는 절차는 `docs/23_PILOT_DEMO_LOCAL_DB_CLEANUP_RUNBOOK.md`에 정리되어 있습니다.
운영 배포 리허설 절차는 `docs/03_OPERATION_DEPLOYMENT_REHEARSAL_CHECKLIST.md`에 정리되어 있습니다.
운영 호스팅과 reverse proxy 구성안은 `docs/04_HOSTING_REVERSE_PROXY_PLAN.md`에 정리되어 있습니다.
backend process 시작, 중지, 재시작 기준은 `docs/05_BACKEND_PROCESS_RUNBOOK.md`에 정리되어 있습니다.
운영 로그 rotation과 장애 기록 양식은 `docs/06_OPERATION_LOG_AND_INCIDENT_RUNBOOK.md`에 정리되어 있습니다.
MVP 1차 운영 환경 결정은 `docs/07_MVP_PRODUCTION_ENVIRONMENT_DECISION.md`에 정리되어 있습니다.
Windows Caddy와 Service wrapper 설정 초안은 `docs/08_WINDOWS_CADDY_SERVICE_TEMPLATES.md`에 정리되어 있습니다.
Windows 운영 수동 리허설 체크리스트는 `docs/09_WINDOWS_OPERATION_REHEARSAL_CHECKLIST.md`에 정리되어 있습니다.
Windows 배포 Quickstart는 상세 런북을 실행 순서대로 묶은 입구 문서입니다.
Prisma migration과 배포 환경 정리 재점검 결과는 `docs/25_PRISMA_MIGRATION_DEPLOYMENT_RECHECK_REPORT.md`에 정리되어 있습니다.
Windows runtime 설정 사전점검 스크립트는 `deploy/windows/Test-MuksanHomepageRuntime.ps1`입니다.
Windows service 조작 보조 스크립트는 `deploy/windows/Invoke-MuksanHomepageService.ps1`입니다.
Windows Caddy 조작 보조 스크립트는 `deploy/windows/Invoke-MuksanHomepageCaddy.ps1`입니다.

로컬에서 운영 배포 흐름을 시뮬레이션하려면 다음 명령을 사용합니다.

```powershell
npm.cmd run rehearse:local-production
```

```powershell
$env:NODE_ENV="production"
$env:DATABASE_URL="file:C:/absolute/path/homepage-prod.db"
$env:HOMEPAGE_CORS_ORIGINS="https://example-academy.muksan.app"
$env:HOMEPAGE_INTERNAL_ACCESS_TOKEN="replace-with-at-least-32-random-characters"
$env:HOST="127.0.0.1"

npm.cmd install
npm.cmd run build
npm.cmd run db:backup
npm.cmd run db:deploy
npm.cmd --workspace backend run start
```

배포 순서 원칙:

- `DATABASE_URL`은 운영에서 반드시 명시합니다.
- `HOMEPAGE_INTERNAL_ACCESS_TOKEN`은 운영에서 반드시 32자 이상의 별도 비밀값으로 설정합니다.
- backend는 기본적으로 `127.0.0.1`에만 bind합니다. reverse proxy 뒤 운영에서는 이 기본값을 유지합니다.
- MVP 1차 운영 기준은 Windows 단일 서버, Caddy same-origin reverse proxy, Windows Service wrapper입니다.
- frontend와 backend를 같은 origin으로 배포하면 frontend는 기본적으로 같은 origin의 `/api`를 호출합니다.
- frontend와 backend를 다른 origin으로 배포하면 frontend build 전에 `VITE_API_BASE_URL`을 지정하고, backend `HOMEPAGE_CORS_ORIGINS`에 허용할 frontend origin을 쉼표로 구분해 명시합니다.
- `npm.cmd run build`는 Prisma Client 생성과 TypeScript build만 수행하며 DB migration을 적용하지 않습니다.
- `npm.cmd run db:backup`은 SQLite DB 파일과 manifest를 백업합니다.
- `npm.cmd run db:deploy`가 `backend/prisma/migrations`의 migration을 적용합니다.
- SQLite `file:` DB를 새로 쓰는 경우 `db:deploy`는 빈 DB 파일을 먼저 보장한 뒤 migration을 적용합니다.
- frontend는 `frontend/dist` 정적 파일을 별도 정적 호스팅 또는 reverse proxy로 제공해야 합니다.
- 운영 backend는 터미널에 직접 띄워 둔 일회성 프로세스가 아니라 process manager 기준으로 시작, 중지, 재시작합니다.

## API

```text
공개 API
GET  /api/health
GET  /api/ready
GET  /api/academies/:slug
POST /api/inquiries

내부 API: Authorization: Bearer <internal token> 필요
GET  /api/academies
PATCH /api/academies/:slug/status
GET  /api/academies/:slug/content-checks
GET  /api/academies/:slug/notices
POST /api/academies/:slug/notices
GET  /api/inquiries
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

내부 제작 화면에서는 접근 키 입력 후 상담 문의를 `NEW`와 `CHECKED` 상태로 표시하고, 확인 처리 또는 되돌리기를 할 수 있습니다. 문의 목록은 상태, 학년, 과목, 검색어로 필터링할 수 있습니다.

공지사항은 내부 제작 화면에서 제목, 날짜, 내용, 중요 여부, 공개 여부를 관리합니다. 공지 목록은 공개 상태, 중요 여부, 검색어로 필터링할 수 있습니다. 공개 홈페이지에는 공개 상태의 공지만 표시됩니다.

홈페이지 제작 상태는 내부 제작 화면의 샘플 학원 카드에서 변경할 수 있으며, 상태 값은 `REQUESTED`, `WAITING_FOR_MATERIALS`, `MATERIALS_READY`, `DRAFT_CREATED`, `INTERNAL_REVIEW`, `CUSTOMER_REVIEW`, `APPROVED`, `PUBLISHED` 중 하나입니다.

내부 제작 화면은 `상태`, `콘텐츠`, `공지`, `문의` 탭으로 나누어 운영자가 필요한 관리 영역만 확인하도록 구성합니다.

`콘텐츠` 탭은 seed JSON에서 읽힌 공개 콘텐츠의 핵심값과 제작 준비도를 빠르게 검수합니다. 현재 점검 항목은 학원명, 대표 문구, 첫 화면 요약, 대상 학년, 대표 과목, 강점 후보, 연락처, 주소, 운영 시간, 상담 안내, 강사진 수, 커리큘럼 수, 대표 이미지, 수업 안내 수, 공개 공지 수, 교통 안내, 주차 안내입니다.

seed JSON은 backend의 콘텐츠 검증 모듈을 통과해야 로드됩니다. 내부 `콘텐츠` 탭도 같은 검증 결과 API를 사용하므로 로더와 운영 화면의 기준이 분리되지 않습니다.

## 프로젝트 원칙

- 고객별 별도 코드베이스를 만들지 않습니다.
- 고객용 자유형 빌더를 만들지 않습니다.
- academy와 exam_system2의 DB를 직접 공유하지 않습니다.
- 실제 학생 개인정보, 학부모 연락처, 결제 정보를 사용하지 않습니다.
- 허위 실적, 허위 후기, 허위 강사 경력을 표시하지 않습니다.
- 기능은 작게 시작하되 공개 홈페이지는 실제 상품처럼 보이게 만듭니다.
