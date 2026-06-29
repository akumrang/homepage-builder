# MVP 구현 상태 점검

Status: Draft  
Project: homepage  
Last Updated: 2026-06-28

---

## 1. 점검 기준

이 문서는 `planning/10_FIRST_IMPLEMENTATION_CHECKLIST.md`를 기준으로 현재 MVP 구현 상태를 점검한 기록이다.

점검 범위는 샘플 학원 `sample-korean-academy`, 공개 홈페이지 `/h/sample-korean-academy`, 내부 제작 화면 `/internal`, 상담 문의 API, 공통 검증 규칙, 로컬 검증 명령이다.

---

## 2. 전체 판단

현재 구현은 첫 구현 완료 판단 기준의 핵심 항목을 충족한다.

- 공개 홈페이지 1종이 `trust-basic-v1` 템플릿으로 렌더링된다.
- 상담 문의는 frontend 검증 후 backend API로 접수되고 Prisma SQLite 저장소에 저장된다.
- 내부 제작 화면에서 샘플 학원 상태, 콘텐츠 점검, 공지, 문의 상태를 확인할 수 있다.
- academy와 exam_system2 DB를 직접 연결하지 않는다.
- README만 보고 설치, 실행, 검증 명령을 찾을 수 있다.

단, 운영 출시 기준의 인증, 권한, 배포, 커스텀 도메인, 실제 academy/exam_system2 연동, 실제 결제/알림 연동은 의도적으로 제외되어 있다.

---

## 3. 체크리스트별 상태

| 영역 | 상태 | 근거 |
|---|---|---|
| 실행 체크 | 완료 | root workspace에 `dev:frontend`, `dev:backend`, `verify`가 있고 frontend 5175, backend 4200 포트가 README에 기록되어 있다. |
| 공개 홈페이지 체크 | 완료 | `frontend/src/App.tsx`가 `/h/sample-korean-academy`를 공개 페이지로 연결하고 `TrustBasicTemplate`이 소개, 강사진, 커리큘럼, 공지, 오시는 길, 상담 CTA를 렌더링한다. |
| 모바일 품질 체크 | 자동 캡처 추가 | 반응형 CSS와 모바일 breakpoint가 구현되어 있고, `docs/11_PUBLIC_HOMEPAGE_VISUAL_QA_REPORT.md`, `docs/21_SECOND_VISUAL_QA_REPORT.md`, `docs/24_SCREENSHOT_REGRESSION_TEST_REPORT.md`에서 수동 QA와 자동 캡처 기준을 기록했다. |
| 게시 모드 체크 | 초안 구현 | `publication.mode`로 샘플, 고객 미리보기, 고객 게시 화면의 footer와 entry 문구를 분리하고, 고객 게시 모드의 샘플 문구 잔존 검증, logo/hero asset 승인 검증, 자료 수집 asset 입력에서 `publication.assets`로의 변환 smoke test를 포함했다. |
| 상담 문의 체크 | 완료 | `InquiryForm`이 보호자 이름, 연락처, 학년, 과목, 문의 내용, 개인정보 동의를 받고 `POST /api/inquiries`로 전송한다. |
| 내부 제작 화면 체크 | 완료 | `/internal`에서 샘플 학원 상태, 콘텐츠 점검과 제작 준비도, logo/hero asset 승인 준비도, 공지 CRUD, 문의 목록/상태 변경을 확인한다. 고객용 자유 편집기 기능은 없다. |
| 데이터 경계 체크 | 완료 | 샘플 JSON과 로컬 SQLite 개발 DB만 사용한다. academy/exam_system2 직접 DB 공유나 실제 개인정보/결제 정보는 없다. |
| 품질 철학 체크 | 완료 | 샘플 문구는 국어학원 공개 홈페이지에 맞춘 안내성 콘텐츠이며 허위 실적, 후기, 강사 경력을 넣지 않았다. |
| 코드 품질 체크 | 완료 | `shared` workspace로 문의 검증 규칙을 공유하고, backend 콘텐츠 검증, API smoke, typecheck, build를 `verify`에 묶었다. |
| Git 체크 | 완료 | `.gitignore`는 개발 DB, dist, env, tsbuildinfo를 제외하고, MVP 구현 변경분은 커밋 단위로 관리되고 있다. |

---

## 4. 주요 구현 근거

| 기능 | 파일 |
|---|---|
| 공개 페이지 라우팅 | `frontend/src/App.tsx` |
| `trust-basic-v1` 템플릿 | `frontend/src/components/TrustBasicTemplate.tsx` |
| 상담 문의 폼 | `frontend/src/components/InquiryForm.tsx` |
| 내부 제작 화면 | `frontend/src/components/InternalDashboard.tsx` |
| frontend API client | `frontend/src/api.ts` |
| Express API | `backend/src/server.ts` |
| 상담 문의 저장소 | `backend/src/inquiryStore.ts` |
| 공지 저장소 | `backend/src/noticeStore.ts` |
| 홈페이지 제작 상태 저장소 | `backend/src/homepageStateStore.ts` |
| 샘플 학원 seed | `backend/content/sample-academies.json` |
| 콘텐츠 검증 | `backend/src/contentValidation.ts` |
| 공통 문의 검증 | `shared/src/index.ts` |
| API smoke test | `backend/src/smokeTest.ts` |
| 브라우저 스크린샷 회귀 테스트 | `scripts/captureVisualRegression.mjs` |

---

## 5. 검증 명령 상태

현재 README 기준 최종 검증 명령은 다음이다.

```powershell
npm.cmd run verify
```

2026-06-26 실행 결과: 통과.

`verify`는 다음 순서로 실행된다.

1. `shared:smoke`
2. `content:validate`
3. `api:smoke`
4. `typecheck`
5. `build`

개별 검증 범위는 다음과 같다.

- `shared:smoke`: frontend/backend 공통 상담 문의 검증 규칙 확인
- `content:validate`: 샘플 학원 seed 구조와 공개 콘텐츠 필수 항목 확인
- `api:smoke`: health, CORS origin guard, readiness, 내부 접근 토큰 설정 방어, 콘텐츠 점검, 제작 상태 변경, 공지 CRUD, 문의 접수, 문의 상태 변경, 개인정보 미동의 차단 확인
- `typecheck`: shared/backend/frontend TypeScript 검사
- `build`: shared/backend/frontend production build
- `visual:regression`: Playwright Chromium으로 공개 홈페이지와 내부 제작 화면의 desktop/mobile 스크린샷 캡처

브라우저 스크린샷 회귀 테스트는 별도 명령으로 실행한다.

```powershell
npm.cmd run visual:regression
```

2026-06-28 실행 결과: 통과. 산출물은 `.tmp/visual-regression/20260628T070534Z/`에 생성됐다.

---

## 6. 보류 또는 의도적 제외 항목

이번 MVP에서 의도적으로 제외한 항목:

- academy 실제 연동
- exam_system2 실제 연동
- 실제 결제 또는 PG 연동
- 문자, 알림톡, 실시간 채팅
- OpenAI API 실제 연결
- 고객용 자유형 빌더
- 커스텀 도메인
- 로그인과 권한 전체 구현
- 다중 템플릿 전체 구현

추가로 남아 있는 품질 보강 항목:

- 실제 운영 서버 provision, HTTPS 인증서 발급, process manager 실제 등록
- 운영 DB 백업 스케줄링과 정기 복구 리허설

운영 배포 전 점검표, health check, 환경 변수, DB 백업 기준은 `docs/01_OPERATION_READINESS_CHECKLIST.md`에 별도 문서화되어 있다. SQLite 백업/복구 실행 절차는 `docs/02_SQLITE_BACKUP_RESTORE_RUNBOOK.md`에 정리되어 있다. 운영 배포 리허설 절차는 `docs/03_OPERATION_DEPLOYMENT_REHEARSAL_CHECKLIST.md`에 정리되어 있으며, 로컬 production 시뮬레이션 명령은 `npm.cmd run rehearse:local-production`이다. 호스팅, reverse proxy, backend `HOST` bind 기준은 `docs/04_HOSTING_REVERSE_PROXY_PLAN.md`에 정리되어 있다. backend process 시작, 중지, 재시작 기준은 `docs/05_BACKEND_PROCESS_RUNBOOK.md`에 정리되어 있다. 운영 로그 rotation과 장애 기록 양식은 `docs/06_OPERATION_LOG_AND_INCIDENT_RUNBOOK.md`에 정리되어 있다. MVP 1차 운영 환경은 Windows 단일 서버, Caddy, Windows Service wrapper로 결정했으며 `docs/07_MVP_PRODUCTION_ENVIRONMENT_DECISION.md`에 정리되어 있다. Windows Caddy와 Service wrapper 설정 초안은 `docs/08_WINDOWS_CADDY_SERVICE_TEMPLATES.md`와 `deploy/windows/`에 둔다. Windows 운영 수동 리허설 체크리스트는 `docs/09_WINDOWS_OPERATION_REHEARSAL_CHECKLIST.md`에 정리되어 있다. Windows 배포 첫 실행 순서는 `docs/10_WINDOWS_DEPLOYMENT_QUICKSTART.md`에 정리되어 있다. 공개 홈페이지 시각 QA는 `docs/11_PUBLIC_HOMEPAGE_VISUAL_QA_REPORT.md`, 샘플과 실제 고객 게시 화면의 분리 기준은 `docs/12_PUBLICATION_MODE_POLICY.md`, 고객 자료 수집 구현 방식 판단은 `docs/13_CUSTOMER_INTAKE_IMPLEMENTATION_DECISION.md`, 첫 파일럿 고객 자료 요청 패킷은 `docs/14_FIRST_PILOT_CUSTOMER_INTAKE_PACKET.md`, 첫 자료 수집 리허설은 `docs/15_FIRST_PILOT_INTAKE_REHEARSAL.md`, 실고객 발송 전 최종 검토는 `docs/16_FIRST_PILOT_INTAKE_PACKET_FINAL_REVIEW.md`, 고객별 발송용 사본 템플릿은 `docs/17_FIRST_PILOT_CUSTOMER_SEND_COPY.md`, 자료 회신 후 접수 기록 양식은 `docs/18_FIRST_PILOT_INTAKE_RECEIPT_RECORD_TEMPLATE.md`, 자료 접수 가상 판정 예시는 `docs/19_FIRST_PILOT_INTAKE_RECEIPT_REHEARSAL.md`, 내부 제작 화면 접근 제어 설계는 `docs/20_INTERNAL_DASHBOARD_ACCESS_CONTROL_PLAN.md`, 2차 시각 QA 결과는 `docs/21_SECOND_VISUAL_QA_REPORT.md`, 자료 누락 체크와 제작 준비도 강화 결과는 `docs/22_MATERIAL_READINESS_ENHANCEMENT_REPORT.md`, 파일럿 시연용 로컬 개발 DB 정리 절차는 `docs/23_PILOT_DEMO_LOCAL_DB_CLEANUP_RUNBOOK.md`, 브라우저 스크린샷 회귀 테스트는 `docs/24_SCREENSHOT_REGRESSION_TEST_REPORT.md`, Prisma migration과 배포 환경 정리 재점검은 `docs/25_PRISMA_MIGRATION_DEPLOYMENT_RECHECK_REPORT.md`, 샘플 갤러리 기획 재검토는 `planning/14_SAMPLE_GALLERY_PLANNING_REVIEW.md`, 샘플 방향 3종 브리프는 `planning/15_SAMPLE_DIRECTION_BRIEFS.md`, 샘플 카드 문안과 고객 기대 관리 문구 초안은 `planning/16_SAMPLE_CARD_COPY_AND_EXPECTATION_GUIDE.md`, 베틀 시스템 내부 검토용 정적 샘플 자료 구성안은 `planning/17_INTERNAL_STATIC_SAMPLE_REVIEW_PACK.md`, 내부 정적 샘플 자료 상담 리허설 체크리스트는 `planning/18_INTERNAL_SAMPLE_REHEARSAL_CHECKLIST.md`, 가상 고객 기준 상담 리허설 기록은 `planning/19_VIRTUAL_CUSTOMER_SAMPLE_REHEARSAL_RECORD.md`, 리허설 결과 기반 문구·자료 순서 보완은 `planning/20_SAMPLE_REHEARSAL_COPY_SEQUENCE_REVISIONS.md`에 정리되어 있다. Windows runtime 설정 사전점검 스크립트는 `deploy/windows/Test-MuksanHomepageRuntime.ps1`, service 조작 보조 스크립트는 `deploy/windows/Invoke-MuksanHomepageService.ps1`, Caddy 조작 보조 스크립트는 `deploy/windows/Invoke-MuksanHomepageCaddy.ps1`이다.

---

## 7. Git 산출물 관리 점검

현재 `.gitignore` 기준 다음 생성물은 저장소에 포함하지 않는다.

- `.tmp/`
- `node_modules/`
- `frontend/dist/`
- `backend/dist/`
- `shared/dist/`
- `backend/data/homepage-dev.db`
- `backend/data/inquiries.jsonl`

커밋 포함 기준:

- root workspace 설정: `.gitignore`, `package.json`, `package-lock.json`
- README 실행/검증/배포 문서: `README.md`
- 프로젝트 정책과 운영 점검 문서: `docs/`
- 구현 범위와 제작 정책 문서: `planning/`
- frontend 앱 소스와 설정: `frontend/`
- backend 앱 소스와 설정: `backend/`
- 공통 검증 workspace: `shared/`

운영 secret, 실제 `.env`, 개발 DB, 빌드 산출물은 커밋하지 않는다.

---

## 8. 다음 판단

다음 작업은 현재 변경분을 커밋하고 원격 저장소에 푸시하는 것이다.

다음 1순위 추천 작업은 베틀 시스템 외부 브랜드 문구 톤 재확인이다. 확인 대상은 `planning/20_SAMPLE_REHEARSAL_COPY_SEQUENCE_REVISIONS.md`의 8번 항목이다.
