# Windows 배포 Quickstart

Status: Draft
Project: homepage
Last Updated: 2026-06-27

---

## 1. 목적

homepage MVP를 Windows 단일 서버에 처음 올릴 때 운영자가 따라갈 최소 순서다.

이 문서는 상세 런북을 대체하지 않는다. 실패 대응과 세부 기준은 다음 문서를 따른다.

- 운영 기준: `docs/01_OPERATION_READINESS_CHECKLIST.md`
- 백업/복구: `docs/02_SQLITE_BACKUP_RESTORE_RUNBOOK.md`
- 배포 리허설: `docs/03_OPERATION_DEPLOYMENT_REHEARSAL_CHECKLIST.md`
- reverse proxy: `docs/04_HOSTING_REVERSE_PROXY_PLAN.md`
- backend process: `docs/05_BACKEND_PROCESS_RUNBOOK.md`
- 로그/장애 기록: `docs/06_OPERATION_LOG_AND_INCIDENT_RUNBOOK.md`
- 운영 환경 결정: `docs/07_MVP_PRODUCTION_ENVIRONMENT_DECISION.md`
- Caddy/Service 템플릿: `docs/08_WINDOWS_CADDY_SERVICE_TEMPLATES.md`
- Windows 수동 리허설: `docs/09_WINDOWS_OPERATION_REHEARSAL_CHECKLIST.md`

---

## 2. 목표 형태

```text
Windows 단일 서버
→ Caddy same-origin HTTPS reverse proxy
→ Windows Service wrapper로 backend 실행
→ frontend/dist 정적 파일 제공
→ SQLite DB는 checkout 밖 보관
```

표준 경로:

```text
C:/muksan-homepage/app
C:/muksan-homepage/data
C:/muksan-homepage/backups
C:/muksan-homepage/logs
C:/muksan-homepage/runtime
```

---

## 3. 전체 순서

### 1. 로컬 또는 CI에서 배포 가능성 확인

```powershell
git status --short
git log -1 --oneline
npm.cmd install
npm.cmd run verify
npm.cmd run rehearse:local-production
```

GO 기준: clean working tree, `verify` 통과, 로컬 production 리허설 통과.

### 2. 운영 서버 기본 준비

필수 준비물:

- Node.js
- Caddy
- Windows Service wrapper 실행 파일
- 운영 또는 staging 도메인
- 32자 이상 내부 접근 토큰

```powershell
New-Item -ItemType Directory -Force -Path C:/muksan-homepage/app
New-Item -ItemType Directory -Force -Path C:/muksan-homepage/data
New-Item -ItemType Directory -Force -Path C:/muksan-homepage/backups
New-Item -ItemType Directory -Force -Path C:/muksan-homepage/logs
New-Item -ItemType Directory -Force -Path C:/muksan-homepage/runtime
```

### 3. app 배치와 build

배포할 app 파일을 `C:/muksan-homepage/app`에 둔 뒤 실행한다.

```powershell
cd C:/muksan-homepage/app
npm.cmd install
npm.cmd run verify
npm.cmd run build
```

GO 기준: `frontend/dist/index.html`, `backend/dist/server.js` 존재.

### 4. 운영 환경 변수 확인

수동 확인용 PowerShell에서 같은 값을 쓴다. 실제 service 환경 변수는 runtime XML에 반영한다.

```powershell
$env:NODE_ENV="production"
$env:DATABASE_URL="file:C:/muksan-homepage/data/homepage-prod.db"
$env:HOMEPAGE_DB_BACKUP_DIR="C:/muksan-homepage/backups"
$env:HOMEPAGE_INTERNAL_ACCESS_TOKEN="<32자 이상 운영 비밀값>"
$env:HOST="127.0.0.1"
$env:PORT="4200"
```

금지: 실제 secret, `.env`, runtime XML, runtime Caddyfile 커밋.

### 5. DB 백업과 migration

```powershell
npm.cmd run db:backup
npm.cmd run db:deploy
```

GO 기준: backup DB와 manifest 생성, migration 성공.

### 6. runtime 파일 생성과 사전점검

```powershell
Copy-Item C:/muksan-homepage/app/deploy/windows/Caddyfile.template C:/muksan-homepage/runtime/Caddyfile
Copy-Item C:/muksan-homepage/app/deploy/windows/muksan-homepage-backend.winsw.xml.template C:/muksan-homepage/runtime/muksan-homepage-backend.xml
```

운영 값으로 교체한다.

- `homepage.example.com`
- `admin@example.com`
- `REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS`
- Node 실행 파일 경로
- app, data, backup, log 경로

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Test-MuksanHomepageRuntime.ps1
```

GO 기준: placeholder 없음, token 32자 이상, build 산출물과 log/backup 경로 존재.

### 7. backend 수동 실행 확인

```powershell
node C:/muksan-homepage/app/backend/dist/server.js
```

별도 PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:4200/api/health
Invoke-RestMethod http://127.0.0.1:4200/api/ready
```

확인 후 직접 실행한 node process를 종료한다.

### 8. Windows Service lifecycle 확인

service wrapper 실행 파일은 다음 위치에 둔다.

```text
C:/muksan-homepage/runtime/muksan-homepage-backend.exe
C:/muksan-homepage/runtime/muksan-homepage-backend.xml
```

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageService.ps1 -Action install
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageService.ps1 -Action start
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageService.ps1 -Action status
Invoke-RestMethod http://127.0.0.1:4200/api/ready
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageService.ps1 -Action restart
Invoke-RestMethod http://127.0.0.1:4200/api/ready
```

GO 기준: service running, restart 후 `/api/ready` 통과, backend log 생성.

### 9. Caddy validation과 HTTPS 확인

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageCaddy.ps1 -Action validate
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageCaddy.ps1 -Action run
```

이미 Caddy service가 운영 중이면 `run` 대신 `reload`를 쓴다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageCaddy.ps1 -Action reload
Invoke-RestMethod https://homepage.example.com/api/health
Invoke-RestMethod https://homepage.example.com/api/ready
```

브라우저 확인:

```text
https://homepage.example.com/h/sample-korean-academy
https://homepage.example.com/internal
```

GO 기준: HTTPS API 통과, 공개 route 새로고침 통과, `/internal` 새로고침 통과, CORS/mixed content/asset 404 없음.

### 10. 결과 기록

| 항목 | 기록 |
|---|---|
| 일시 |  |
| 실행자 |  |
| 커밋 해시 |  |
| 서버 |  |
| 도메인 |  |
| Node version |  |
| Caddy version |  |
| Service wrapper |  |
| DB 경로 |  |
| backup 경로 |  |
| log 경로 |  |
| 결과 | GO / NO-GO |
| 비고 |  |

---

## 4. NO-GO 기준

다음 중 하나라도 있으면 운영 전환을 중단한다.

- `verify`, `build`, `db:backup`, `db:deploy` 실패
- runtime 사전점검 실패
- 운영 내부 접근 토큰 placeholder 잔존
- `/api/ready` 실패
- service restart 후 backend 미복구
- Caddy validation 실패
- HTTPS origin에서 공개 route 또는 `/api/*` 실패
- DB, backup, log가 app checkout 내부에 위치

실패 기록은 `docs/06_OPERATION_LOG_AND_INCIDENT_RUNBOOK.md`의 양식을 따른다.

