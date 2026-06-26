# SQLite 백업/복구 Runbook

Status: Draft
Project: homepage
Last Updated: 2026-06-26

---

## 1. 목적

이 문서는 homepage MVP의 Prisma SQLite DB를 운영에서 백업하고 복구하는 최소 절차를 정의한다.

현재 대상은 `DATABASE_URL=file:...` 형태의 SQLite 파일 DB다. PostgreSQL, MySQL, 외부 관리형 DB는 이 문서의 대상이 아니다.

---

## 2. 기본 원칙

- 운영 DB 백업은 배포 전, migration 전, 정기 스케줄 기준으로 남긴다.
- 백업 파일은 개인정보를 포함할 수 있으므로 외부 공유하지 않는다.
- 백업 파일은 Git에 커밋하지 않는다.
- 복구는 backend 프로세스를 중지한 상태에서 수행한다.
- 복구 명령은 기본적으로 dry-run이며, 실제 덮어쓰기는 `--force`가 있어야 한다.
- 기존 대상 DB가 있으면 restore script가 먼저 `pre-restore-*.db` 안전 백업을 만든다.
- 백업/복구 script는 SQLite `-wal`, `-shm`, `-journal` 동반 파일이 있으면 중단한다.

---

## 3. 환경 변수

운영 예:

```powershell
$env:NODE_ENV="production"
$env:DATABASE_URL="file:C:/absolute/path/homepage-prod.db"
$env:HOMEPAGE_DB_BACKUP_DIR="C:/absolute/path/homepage-backups"
```

| 변수 | 기준 |
|---|---|
| `DATABASE_URL` | 백업/복구 대상 SQLite DB. 운영에서는 필수 |
| `HOMEPAGE_DB_BACKUP_DIR` | 백업 파일 저장 위치. 없으면 backend workspace의 `backups` 사용 |

운영에서는 `HOMEPAGE_DB_BACKUP_DIR`를 배포 산출물 삭제 대상이 아닌 경로로 지정한다.

---

## 4. 백업 절차

backend가 실행 중인 작은 MVP 환경에서는 파일 복사가 대체로 동작할 수 있다. 다만 상담 문의가 들어오는 운영 상태에서는 가능한 한 요청이 없는 시간대에 백업한다.

백업 명령:

```powershell
npm.cmd run db:backup
```

라벨과 저장 경로를 명시하는 예:

```powershell
npm.cmd --workspace backend run db:backup -- --label homepage-prod --out-dir C:/absolute/path/homepage-backups
```

결과:

- `homepage-prod-YYYYMMDDTHHMMSSZ.db`
- `homepage-prod-YYYYMMDDTHHMMSSZ.db.manifest.json`

manifest에는 백업 파일 크기와 SHA256이 기록된다.

SQLite `-wal`, `-shm`, `-journal` 동반 파일이 감지되면 백업은 중단된다. 이 경우 backend 프로세스를 중지한 뒤 다시 백업한다.

---

## 5. 복구 전 확인

복구 전에는 먼저 dry-run을 실행한다.

```powershell
npm.cmd --workspace backend run db:restore -- --backup C:/absolute/path/homepage-backups/homepage-prod-YYYYMMDDTHHMMSSZ.db
```

dry-run 확인 항목:

- backup 파일 경로
- target DB 경로
- backup byte size
- backup SHA256
- manifest 검증 여부

이 단계는 DB를 덮어쓰지 않는다.

---

## 6. 실제 복구 절차

실제 복구 순서:

1. backend 프로세스를 중지한다.
2. 현재 운영 DB 파일 위치를 확인한다.
3. dry-run으로 backup과 target 경로를 확인한다.
4. `--force`로 복구한다.
5. backend를 다시 시작한다.
6. `/api/ready`를 확인한다.
7. 공개 홈페이지와 내부 문의 목록을 확인한다.

복구 명령:

```powershell
npm.cmd --workspace backend run db:restore -- --backup C:/absolute/path/homepage-backups/homepage-prod-YYYYMMDDTHHMMSSZ.db --force
```

복구 후 확인:

```powershell
Invoke-RestMethod http://localhost:4200/api/ready
```

복구 script는 기존 target DB가 있으면 backup directory에 `pre-restore-YYYYMMDDTHHMMSSZ.db`를 먼저 생성한다.

target DB 주변에 SQLite `-wal`, `-shm`, `-journal` 동반 파일이 있으면 복구는 중단된다. 이 경우 backend 프로세스가 완전히 중지되었는지 먼저 확인한다.

---

## 7. 정기 운영 기준

최소 권장:

- 매일 1회 `db:backup`
- 배포 직전 1회 `db:backup`
- `db:deploy` 직전 1회 `db:backup`
- 최근 7일 백업 보관
- 월 1회 복구 리허설

복구 리허설은 운영 DB에 직접 하지 않는다. 별도 테스트 DB 경로를 `DATABASE_URL`로 지정해 restore dry-run과 `--force` 복구를 확인한다.

---

## 8. 현재 구현 근거

| 항목 | 근거 |
|---|---|
| 백업 script | `backend/scripts/backupSqlite.mjs` |
| 복구 script | `backend/scripts/restoreSqlite.mjs` |
| SQLite URL 공통 처리 | `backend/scripts/sqliteDatabaseUtils.mjs` |
| root 백업 명령 | `package.json`의 `db:backup` |
| root 복구 명령 | `package.json`의 `db:restore` |
| backend 백업 명령 | `backend/package.json`의 `db:backup` |
| backend 복구 명령 | `backend/package.json`의 `db:restore` |

---

## 9. 한계

현재 script는 SQLite 파일 백업의 최소 구현이다.

아직 포함하지 않은 것:

- 자동 스케줄러
- 외부 스토리지 업로드
- 백업 보관 기간 자동 정리
- SQLite online backup API
- 운영 알림 연동
