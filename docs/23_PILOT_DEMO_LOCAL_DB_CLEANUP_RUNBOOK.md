# 파일럿 시연용 로컬 개발 DB 정리 절차

Status: Draft
Project: homepage
Last Updated: 2026-06-28

---

## 1. 목적

이 문서는 묵산 내부 판정 또는 첫 고객 파일럿 시연 전에 로컬 개발 DB를 통제된 상태로 정리하는 절차를 정의한다.

2차 시각 QA에서 내부 문의 탭에 과거 테스트 문의가 남아 있는 문제가 확인됐다. 기능 오류는 아니지만, 시연 화면에서는 실제 운영 품질을 판단하기 어렵게 만든다.

이 절차의 목적은 다음이다.

- 시연 전 내부 화면에 오래된 테스트 문의가 섞이지 않게 한다.
- 공개 홈페이지, 내부 제작 화면, 상담 문의 접수 흐름을 깨끗한 로컬 데이터로 확인한다.
- 실제 고객 개인정보나 운영 DB를 건드리지 않는다.
- 고객용 자유 편집기나 운영자용 데이터 삭제 기능을 새로 만들지 않는다.

---

## 2. 적용 범위

대상:

- 로컬 개발 DB
- 기본 DB 경로: `backend/data/homepage-dev.db`
- 기본 DB URL: `file:../data/homepage-dev.db`
- 로컬 시연 전 테스트 문의, 공지, 제작 상태 확인

비대상:

- 운영 DB
- 실제 고객 문의
- 실제 학부모 또는 학생 개인정보
- 배포 서버의 백업 보관 정책
- 운영 관리자용 데이터 삭제 기능

운영 DB 백업과 복구 기준은 `docs/02_SQLITE_BACKUP_RESTORE_RUNBOOK.md`를 따른다.

---

## 3. 기본 원칙

- 로컬 개발 DB 정리는 시연 준비 작업이지 운영 데이터 관리 기능이 아니다.
- 지우기 전에 반드시 백업하거나 active DB 파일을 격리한다.
- `NODE_ENV=production` 상태에서는 이 절차를 실행하지 않는다.
- `DATABASE_URL`이 운영 DB나 외부 경로를 가리키면 즉시 중단한다.
- 정리 후에는 공개 홈페이지, 상담 문의 제출, 내부 문의 목록을 다시 확인한다.
- 정리 과정에서 생성된 DB 파일, 백업 파일, restore log는 Git에 커밋하지 않는다.

---

## 4. 현재 구현 근거

| 항목 | 근거 |
|---|---|
| 기본 로컬 DB URL | `backend/scripts/sqliteDatabaseUtils.mjs`의 `file:../data/homepage-dev.db` |
| 로컬 DB 파일 제외 | `.gitignore`의 `backend/data/*.db` |
| DB 초기화 명령 | root `package.json`의 `db:init` |
| 백업 명령 | root `package.json`의 `db:backup` |
| 복구 명령 | root `package.json`의 `db:restore` |
| Prisma schema | `backend/prisma/schema.prisma` |
| 초기 store 보장 | `backend/src/initDatabase.ts` |

현재 `db:init`은 Prisma Client 생성, `prisma db push`, 홈페이지 상태/공지/문의 store 보장을 수행한다.

---

## 5. 정리 전 확인

PowerShell을 저장소 root에서 연다.

```powershell
git status --short --branch
$env:NODE_ENV
$env:DATABASE_URL
```

중단 조건:

- `$env:NODE_ENV`가 `production`이다.
- `$env:DATABASE_URL`이 비어 있지 않고 로컬 개발 DB가 아닌 다른 DB를 가리킨다.
- backend dev server가 아직 실행 중이다.
- SQLite `-wal`, `-shm`, `-journal` 동반 파일이 남아 있다.

backend와 frontend dev server를 먼저 중지한다.

---

## 6. 백업

정리 전 로컬 개발 DB를 백업한다.

```powershell
npm.cmd --workspace backend run db:backup -- --label homepage-dev-before-pilot --out-dir ../.tmp/demo-db-backups
```

백업 성공 시 `.tmp/demo-db-backups` 아래에 다음 파일이 생긴다.

- `homepage-dev-before-pilot-YYYYMMDDTHHMMSSZ.db`
- `homepage-dev-before-pilot-YYYYMMDDTHHMMSSZ.db.manifest.json`

`.tmp/`는 Git 제외 대상이다.

DB 파일이 아직 없어서 백업 명령이 실패하면 첫 초기화 전 상태로 판단하고 7장으로 진행한다.

---

## 7. 권장 정리 방식

첫 파일럿 시연 전에는 부분 삭제보다 fresh local DB 재생성을 권장한다.

이유:

- 현재 MVP에는 운영자용 문의 삭제 API가 없다.
- 상담 문의 상태, 공지, 제작 상태가 과거 테스트와 섞이면 시연 판단이 흐려진다.
- 로컬 개발 DB는 seed와 `db:init`으로 다시 만들 수 있다.

실행 원칙:

1. backend dev server를 중지한다.
2. 6장의 백업을 남긴다.
3. active DB 파일을 삭제하지 말고 `.tmp/` 아래로 격리한다.
4. `db:init`으로 로컬 DB를 다시 만든다.
5. 공개 홈페이지와 내부 화면을 확인한다.

예시:

```powershell
New-Item -ItemType Directory -Force -Path .tmp/demo-db-archive | Out-Null
if (Test-Path -LiteralPath backend/data/homepage-dev.db) {
  Move-Item -LiteralPath backend/data/homepage-dev.db -Destination .tmp/demo-db-archive/homepage-dev-before-pilot.db
}
npm.cmd run db:init
```

위 예시는 로컬 개발 DB 전용이다. 운영 DB에는 사용하지 않는다.

`homepage-dev.db-wal`, `homepage-dev.db-shm`, `homepage-dev.db-journal` 파일이 있으면 backend가 완전히 중지되지 않았을 가능성이 크다. 이 경우 파일을 옮기기 전에 backend 프로세스부터 정리한다.

---

## 8. 시연용 권장 데이터 상태

정리 후 권장 상태:

| 항목 | 권장 상태 |
|---|---|
| 상담 문의 | 0건 또는 가짜 정보 1건 |
| 보호자 이름 | 실제 이름 금지. 예: `테스트 보호자` |
| 연락처 | 실제 연락처 금지. 예: `010-0000-0000` |
| 제작 상태 | 시연 목적에 맞게 `REQUESTED`, `WAITING_FOR_MATERIALS`, `MATERIALS_READY` 중 하나 |
| 공지 | seed에 포함된 샘플 공지만 유지 |
| 공개 홈페이지 | `/h/sample-korean-academy` 정상 렌더링 |
| 내부 화면 | `/internal` 접근 키 입력 후 상태, 콘텐츠, 공지, 문의 탭 정상 표시 |

시연 흐름에서 상담 문의 접수를 보여줘야 한다면 정리 후 공개 홈페이지에서 새 테스트 문의 1건을 직접 제출한다.

---

## 9. 정리 후 검증

로컬 DB 재생성 후 다음 명령을 실행한다.

```powershell
npm.cmd run verify
```

시연 직전 화면 확인:

```text
http://127.0.0.1:5175/h/sample-korean-academy
http://127.0.0.1:5175/internal
http://localhost:4200/api/ready
```

확인 항목:

- 공개 홈페이지가 로드된다.
- 상담 문의 폼이 정상 표시된다.
- 테스트 문의 제출 후 완료 메시지가 나온다.
- 내부 문의 탭에 제출한 테스트 문의만 보인다.
- 내부 콘텐츠 탭의 `MATERIALS_READY` 게이트가 정상 표시된다.
- 오래된 실험용 문의나 실제 개인정보가 보이지 않는다.

---

## 10. GO / NO-GO 기준

| 판정 | 기준 |
|---|---|
| GO | 로컬 DB가 백업되었고, 공개 홈페이지와 내부 화면이 깨끗한 테스트 데이터로 확인된다. |
| 조건부 GO | 과거 테스트 문의가 남아 있지만 시연 화면에서 숨기거나 명확히 설명할 수 있다. |
| NO-GO | 실제 개인정보가 보인다. |
| NO-GO | `DATABASE_URL`이 운영 DB를 가리킨 상태에서 정리 명령을 실행하려 한다. |
| NO-GO | backend가 켜진 상태에서 DB 파일을 옮기려 한다. |
| NO-GO | 정리 후 `npm.cmd run verify`가 실패한다. |

---

## 11. 하지 않을 것

이번 절차에서 하지 않는다.

- 운영 DB reset
- 실제 고객 문의 삭제
- SQL 직접 실행 절차 추가
- 내부 제작 화면에 삭제 버튼 추가
- 고객 포털 추가
- 고객용 자유형 편집기 추가
- 개인정보가 포함된 DB 백업을 저장소에 커밋

문의 삭제나 보존 정책은 실제 운영 정책이 확정된 뒤 별도 설계한다.

---

## 12. 다음 작업

이 문서 변경분을 커밋한 뒤 다음 1순위 추천 작업은 모바일/데스크톱 브라우저 스크린샷 기반 자동 회귀 테스트를 추가하는 것이다.

이유:

- 시각 QA는 이미 1차, 2차 수동 확인을 거쳤다.
- 출시 전 반복 확인이 필요한 화면은 공개 홈페이지와 내부 제작 화면이다.
- 자동 스크린샷 회귀 테스트가 있으면 묵산의 직접 시각 판정 전후로 레이아웃 깨짐을 더 빨리 잡을 수 있다.
