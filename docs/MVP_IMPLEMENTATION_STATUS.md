# MVP 구현 상태 점검

Status: Draft  
Project: homepage  
Last Updated: 2026-06-26

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
| 모바일 품질 체크 | 부분 확인 | 반응형 CSS와 모바일 breakpoint가 구현되어 있다. 자동 build는 통과 대상이며, 별도 브라우저 스크린샷 회귀 테스트는 아직 없다. |
| 상담 문의 체크 | 완료 | `InquiryForm`이 보호자 이름, 연락처, 학년, 과목, 문의 내용, 개인정보 동의를 받고 `POST /api/inquiries`로 전송한다. |
| 내부 제작 화면 체크 | 완료 | `/internal`에서 샘플 학원 상태, 콘텐츠 점검과 제작 준비도, 공지 CRUD, 문의 목록/상태 변경을 확인한다. 고객용 자유 편집기 기능은 없다. |
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
- `api:smoke`: health, CORS origin guard, readiness, 콘텐츠 점검, 제작 상태 변경, 공지 CRUD, 문의 접수, 문의 상태 변경, 개인정보 미동의 차단 확인
- `typecheck`: shared/backend/frontend TypeScript 검사
- `build`: shared/backend/frontend production build

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

- 모바일/데스크톱 브라우저 스크린샷 기반 회귀 테스트
- 내부 화면 접근 제어 설계
- 실제 운영 호스팅, HTTPS, reverse proxy 구성
- 운영 DB 백업 스케줄링과 정기 복구 리허설

운영 배포 전 점검표, health check, 환경 변수, DB 백업 기준은 `docs/01_OPERATION_READINESS_CHECKLIST.md`에 별도 문서화되어 있다. SQLite 백업/복구 실행 절차는 `docs/02_SQLITE_BACKUP_RESTORE_RUNBOOK.md`에 정리되어 있다. 운영 배포 리허설 절차는 `docs/03_OPERATION_DEPLOYMENT_REHEARSAL_CHECKLIST.md`에 정리되어 있으며, 로컬 production 시뮬레이션 명령은 `npm.cmd run rehearse:local-production`이다.

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

다음 작업은 문서화된 운영 배포 기준을 실제 인프라 작업 단위로 쪼개는 것이다.
