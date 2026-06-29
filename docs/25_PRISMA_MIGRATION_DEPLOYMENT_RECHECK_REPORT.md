# Prisma migration과 배포 환경 정리 재점검 보고서

Status: Draft  
Project: homepage  
Last Updated: 2026-06-28

---

## 1. 목적

이 문서는 홈페이지 MVP의 운영 전 DB migration 적용 흐름과 배포 환경 문서가 서로 어긋나지 않는지 재점검한 기록이다.

이번 작업은 고객 기능을 늘리는 작업이 아니다. 운영 전 `db:init`, `db:deploy`, SQLite DB 경로, 백업, production build, same-origin API 호출 기준이 현재 코드와 문서에서 일관되는지 확인하는 작업이다.

---

## 2. 점검한 파일

| 영역 | 파일 |
|---|---|
| Prisma schema | `backend/prisma/schema.prisma` |
| 초기 migration | `backend/prisma/migrations/20260626000000_init/migration.sql` |
| SQLite env wrapper | `backend/scripts/withPrismaEnv.mjs` |
| SQLite DB URL helper | `backend/scripts/sqliteDatabaseUtils.mjs` |
| 로컬 production 리허설 | `scripts/rehearseLocalProduction.mjs` |
| 실행/배포 안내 | `README.md` |
| 운영 readiness | `docs/01_OPERATION_READINESS_CHECKLIST.md` |
| 배포 리허설 | `docs/03_OPERATION_DEPLOYMENT_REHEARSAL_CHECKLIST.md` |
| Windows quickstart | `docs/10_WINDOWS_DEPLOYMENT_QUICKSTART.md` |

---

## 3. 결론

MVP 수준에서는 Prisma migration과 배포 환경 정리 상태를 완료로 본다.

확인 결과:

- `db:init`은 로컬 개발 DB 준비용 명령으로 유지되어 있다.
- 운영 또는 production 리허설에서는 `db:deploy`가 `prisma migrate deploy`를 실행한다.
- `NODE_ENV=production`에서는 `DATABASE_URL`이 없으면 실패한다.
- SQLite `file:` DB가 새 파일이면 `db:deploy` 전에 빈 파일을 보장한다.
- 초기 migration은 현재 MVP 테이블과 인덱스를 생성한다.
- 문서의 운영 순서는 `build`, `db:backup`, `db:deploy`, backend start, readiness 확인으로 정리되어 있다.
- local production 리허설이 fresh SQLite DB에서 통과했다.
- 운영 DB reset, 실제 데이터 삭제, 고객 기능 추가는 하지 않았다.

---

## 4. 핵심 코드 근거

`backend/scripts/sqliteDatabaseUtils.mjs`는 production에서 `DATABASE_URL` 누락을 허용하지 않는다.

```js
export function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL must be set when NODE_ENV=production.");
  }

  return defaultLocalDatabaseUrl;
}
```

`backend/scripts/withPrismaEnv.mjs`는 `prisma migrate deploy` 또는 `status` 전에 새 SQLite 파일을 보장한다.

```js
const shouldEnsureSqliteDatabase =
  command === "prisma" &&
  args[0] === "migrate" &&
  (args[1] === "deploy" || args[1] === "status");

if (shouldEnsureSqliteDatabase) {
  let sqliteFilePath = null;

  try {
    sqliteFilePath = resolveSqliteFilePath(process.env.DATABASE_URL, readSchemaPathFromArgs(args));
  } catch {
    sqliteFilePath = null;
  }

  if (sqliteFilePath && !existsSync(sqliteFilePath)) {
    mkdirSync(path.dirname(sqliteFilePath), { recursive: true });
    closeSync(openSync(sqliteFilePath, "a"));
  }
}
```

`scripts/rehearseLocalProduction.mjs`는 같은 origin 배포 기준으로 production build와 backend를 함께 검증한다.

```js
await run(npmCommand, ["run", "db:deploy"], rehearsalEnv, "Prepare baseline rehearsal DB");
await run(npmCommand, ["run", "build"], rehearsalEnv, "Build shared, backend, and frontend");
await run(
  npmCommand,
  ["run", "db:backup", "--", "--label", "homepage-rehearsal", "--out-dir", backupDirectory],
  rehearsalEnv,
  "Back up rehearsal DB"
);
await run(npmCommand, ["run", "db:deploy"], rehearsalEnv, "Apply migrations to rehearsal DB");
```

---

## 5. 실행 검증 결과

실행 명령:

```powershell
npm.cmd run rehearse:local-production
```

결과:

```text
passed
```

확인된 리허설 산출물:

```text
.tmp/local-production-rehearsal/20260628T101642Z/
```

리허설에서 확인된 항목:

- fresh SQLite DB에 초기 migration 적용
- shared, backend, frontend production build
- `frontend/dist/index.html`과 asset bundle 존재
- SQLite backup DB와 manifest 생성
- 두 번째 `db:deploy`에서 pending migration 없음 확인
- production build backend start
- `/api/health` 통과
- `/api/ready` 통과
- `/api/academies/sample-korean-academy` 통과
- frontend dist server에서 `/h/sample-korean-academy` 제공 확인
- frontend same-origin `/api/ready` proxy 확인

---

## 6. 판정

GO:

- 현재 MVP의 SQLite migration 적용 흐름은 운영 전 최소 기준을 만족한다.
- README, 운영 readiness, 배포 리허설, Windows quickstart의 DB 적용 방향은 서로 충돌하지 않는다.
- local production rehearsal은 fresh DB와 same-origin frontend API 기준을 통과했다.

NO-GO가 아닌 보류 항목:

- 실제 Windows service 설치
- 실제 Caddy HTTPS 인증서 발급
- 실제 운영 DB 경로 권한 확인
- 운영 백업 스케줄러 등록
- 실제 운영 DB restore 리허설
- PostgreSQL 또는 관리형 DB 전환

---

## 7. 다음 작업

다음 1순위 추천 작업은 이 변경분을 커밋하고 원격 저장소에 푸시하는 것이다.

커밋 후 다음 추천 작업은 샘플 갤러리 기획 재검토다.

단, 샘플 갤러리는 구현이 아니라 기획 재검토다. 검토 범위는 다음으로 제한한다.

- 고객 디자인 권리 2단계인 `방향 선택형`을 어떤 화면과 문구로 설명할지
- 갤러리가 고객용 자유형 빌더로 오해되지 않게 하는 경계
- 2~3개 샘플 방향을 만들기 전 확정해야 할 템플릿 후보
- 고객 선택값을 즉시 반영하지 않고 베틀 시스템 검수 절차로 받는 방식
