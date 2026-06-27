# Windows 운영 수동 리허설 체크리스트

Status: Draft
Project: homepage
Last Updated: 2026-06-27

---

## 1. 목적

이 문서는 MVP 1차 운영 기준인 Windows 단일 서버, Caddy, Windows Service wrapper 조합을 실제 운영 서버 또는 staging 서버에서 수동으로 리허설하는 절차를 정의한다.

목표는 다음 네 가지를 운영자 손으로 끝까지 확인하는 것이다.

```text
Caddy validation
→ backend service install
→ service start/stop/restart
→ HTTPS same-origin route 확인
```

이 문서는 자동 설치 스크립트가 아니다. 운영 반영 전 `GO / NO-GO` 판단을 위한 수동 체크리스트다.

---

## 2. 전제

필수 전제:

- `npm.cmd run rehearse:local-production`이 로컬에서 통과했다.
- 운영 서버에 Node.js가 설치되어 있다.
- 운영 서버에 Caddy가 설치되어 있고 `caddy` 명령이 실행된다.
- Windows Service wrapper 실행 파일이 준비되어 있다.
- `C:/muksan-homepage/app`에 배포할 app 파일이 있다.
- `C:/muksan-homepage/data`, `backups`, `logs`, `runtime` directory가 있다.
- 실제 운영 secret은 저장소 파일에 쓰지 않는다.

디렉터리 생성 예:

```powershell
New-Item -ItemType Directory -Force -Path C:/muksan-homepage/app
New-Item -ItemType Directory -Force -Path C:/muksan-homepage/data
New-Item -ItemType Directory -Force -Path C:/muksan-homepage/backups
New-Item -ItemType Directory -Force -Path C:/muksan-homepage/logs
New-Item -ItemType Directory -Force -Path C:/muksan-homepage/runtime
```

---

## 3. 기록 양식

리허설마다 다음 값을 남긴다.

| 항목 | 기록 |
|---|---|
| 리허설 일시 |  |
| 실행자 |  |
| 서버 |  |
| 커밋 해시 |  |
| 운영 도메인 또는 staging 도메인 |  |
| Node 경로 |  |
| Caddy version |  |
| Service wrapper 종류/version |  |
| DB 경로 |  |
| backup directory |  |
| log directory |  |
| 결과 | GO / NO-GO |
| 비고 |  |

확인 명령:

```powershell
git log -1 --oneline
node --version
caddy version
```

---

## 4. Step 1: Build와 DB 준비

명령:

```powershell
cd C:/muksan-homepage/app
npm.cmd install
npm.cmd run verify
npm.cmd run build
```

운영 환경 변수는 runtime service XML에 들어가지만, 수동 확인용 PowerShell에서도 같은 값을 임시로 설정한다.

```powershell
$env:NODE_ENV="production"
$env:DATABASE_URL="file:C:/muksan-homepage/data/homepage-prod.db"
$env:HOMEPAGE_DB_BACKUP_DIR="C:/muksan-homepage/backups"
$env:HOMEPAGE_INTERNAL_ACCESS_TOKEN="<32자 이상 리허설 또는 운영 비밀값>"
$env:HOST="127.0.0.1"
$env:PORT="4200"
```

DB 준비:

```powershell
npm.cmd run db:backup
npm.cmd run db:deploy
```

판정 기준:

- `verify` 통과
- `build` 통과
- backup 파일과 manifest 생성
- migration 적용 성공

실패 시:

- service 등록 금지
- Caddy 공개 전환 금지
- 실패 로그와 커밋 해시 기록

---

## 5. Step 2: Runtime 설정 파일 생성

Caddyfile 복사:

```powershell
Copy-Item C:/muksan-homepage/app/deploy/windows/Caddyfile.template C:/muksan-homepage/runtime/Caddyfile
```

Service XML 복사:

```powershell
Copy-Item C:/muksan-homepage/app/deploy/windows/muksan-homepage-backend.winsw.xml.template C:/muksan-homepage/runtime/muksan-homepage-backend.xml
```

교체 확인:

- `admin@example.com`을 운영 이메일로 교체
- `homepage.example.com`을 운영 또는 staging 도메인으로 교체
- `REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS`를 실제 32자 이상 secret으로 교체
- Node 실행 파일 경로 확인
- `C:/muksan-homepage/app/backend/dist/server.js` 존재 확인
- `C:/muksan-homepage/app/frontend/dist/index.html` 존재 확인

확인 명령:

```powershell
Select-String -Path C:/muksan-homepage/runtime/Caddyfile -Pattern "homepage.example.com|admin@example.com"
Select-String -Path C:/muksan-homepage/runtime/muksan-homepage-backend.xml -Pattern "REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS"
Test-Path C:/muksan-homepage/app/backend/dist/server.js
Test-Path C:/muksan-homepage/app/frontend/dist/index.html
```

판정 기준:

- placeholder가 남아 있지 않다.
- runtime 설정 파일은 Git에 커밋하지 않는다.
- runtime 설정 파일은 운영 서버 전용으로 보관한다.

---

## 6. Step 3: Caddy Validation

validation 전에 runtime 사전점검을 실행한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Test-MuksanHomepageRuntime.ps1
```

사전점검이 실패하면 Caddy validation과 service install을 진행하지 않는다.

명령:

```powershell
caddy validate --config C:/muksan-homepage/runtime/Caddyfile
```

선택 확인:

```powershell
caddy fmt --overwrite C:/muksan-homepage/runtime/Caddyfile
caddy validate --config C:/muksan-homepage/runtime/Caddyfile
```

판정 기준:

- validation이 오류 없이 통과한다.
- `/api/*` block이 `127.0.0.1:4200`으로 proxy한다.
- `/assets/*` block이 `frontend/dist/assets`를 제공한다.
- SPA fallback이 `frontend/dist/index.html`로 연결된다.
- access log 경로가 `C:/muksan-homepage/logs` 아래다.

실패 시:

- Caddy 실행 금지
- service 공개 전환 금지
- Caddyfile의 도메인, 경로, brace 구조, log path 확인

---

## 7. Step 4: Backend 수동 실행 확인

service 등록 전에 같은 환경 변수로 backend를 직접 실행한다.

```powershell
node C:/muksan-homepage/app/backend/dist/server.js
```

별도 PowerShell에서 확인:

```powershell
Invoke-RestMethod http://127.0.0.1:4200/api/health
Invoke-RestMethod http://127.0.0.1:4200/api/ready
```

판정 기준:

- backend가 `127.0.0.1:4200`에서만 응답한다.
- `/api/health`가 `ok: true`다.
- `/api/ready`가 `ok: true`다.
- readiness checks에 `internal-access-token`, `database`, `inquiry-store`, `notice-store`가 포함된다.

확인 후 직접 실행한 node 프로세스를 중지한다.

포트 종료 확인:

```powershell
Test-NetConnection 127.0.0.1 -Port 4200
```

`TcpTestSucceeded`가 `False`여야 service 등록 전 정리 완료로 본다.

---

## 8. Step 5: Service Install

WinSW 계열 wrapper 기준 예:

```powershell
Copy-Item C:/path/to/winsw.exe C:/muksan-homepage/runtime/muksan-homepage-backend.exe
C:/muksan-homepage/runtime/muksan-homepage-backend.exe install
```

설치 확인:

```powershell
C:/muksan-homepage/runtime/muksan-homepage-backend.exe status
Get-Service muksan-homepage-backend
```

판정 기준:

- service가 Windows service 목록에 등록된다.
- service name 또는 id가 `muksan-homepage-backend`다.
- 아직 start하지 않았다면 status는 stopped여도 된다.

실패 시:

- wrapper exe와 XML 파일명이 같은지 확인
- XML 파싱 오류 확인
- 관리자 권한 PowerShell 여부 확인
- Node 경로와 working directory 확인

---

## 9. Step 6: Service Start

명령:

```powershell
C:/muksan-homepage/runtime/muksan-homepage-backend.exe start
```

확인:

```powershell
C:/muksan-homepage/runtime/muksan-homepage-backend.exe status
Invoke-RestMethod http://127.0.0.1:4200/api/health
Invoke-RestMethod http://127.0.0.1:4200/api/ready
```

판정 기준:

- service status가 running이다.
- `/api/health` 통과
- `/api/ready` 통과
- `C:/muksan-homepage/logs` 아래 backend log가 생성된다.
- `REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS` placeholder가 runtime XML에 남아 있지 않다.

실패 시:

- `backend-error` log 확인
- service XML env 확인
- `DATABASE_URL` 파일 권한 확인
- `HOST`, `PORT` 충돌 확인
- readiness 실패 check 기록

---

## 10. Step 7: Service Stop

명령:

```powershell
C:/muksan-homepage/runtime/muksan-homepage-backend.exe stop
```

확인:

```powershell
C:/muksan-homepage/runtime/muksan-homepage-backend.exe status
Test-NetConnection 127.0.0.1 -Port 4200
```

판정 기준:

- service status가 stopped다.
- `TcpTestSucceeded`가 `False`다.
- SQLite `-wal`, `-shm`, `-journal` 동반 파일이 남아 있으면 원인을 확인한다.

실패 시:

- service stop timeout 확인
- 남은 node 프로세스 확인
- port owner 확인
- DB backup 또는 migration 진행 금지

---

## 11. Step 8: Service Restart

명령:

```powershell
C:/muksan-homepage/runtime/muksan-homepage-backend.exe start
C:/muksan-homepage/runtime/muksan-homepage-backend.exe restart
```

확인:

```powershell
C:/muksan-homepage/runtime/muksan-homepage-backend.exe status
Invoke-RestMethod http://127.0.0.1:4200/api/ready
```

판정 기준:

- restart 후 status가 running이다.
- restart 후 `/api/ready`가 통과한다.
- restart 과정에서 DB lock, migration 오류, seed 로드 오류가 없다.

실패 시:

- traffic 전환 금지
- service wrapper failure action 확인
- backend log와 readiness 실패 check 기록

---

## 12. Step 9: Caddy Run / Reload

service가 running인 상태에서 Caddy를 실행하거나 reload한다.

수동 실행:

```powershell
caddy run --config C:/muksan-homepage/runtime/Caddyfile
```

이미 Caddy service가 있다면 reload:

```powershell
caddy reload --config C:/muksan-homepage/runtime/Caddyfile
```

판정 기준:

- Caddy가 오류 없이 시작 또는 reload된다.
- 인증서 발급 또는 HTTPS 설정 오류가 없다.
- Caddy log가 `C:/muksan-homepage/logs` 아래에 남는다.

실패 시:

- DNS가 운영 서버를 향하는지 확인
- 80/443 port 사용 중 여부 확인
- Caddyfile validation 재실행
- Caddy error log 기록

---

## 13. Step 10: Same-Origin 운영 확인

HTTPS origin에서 확인한다.

```powershell
Invoke-RestMethod https://homepage.example.com/api/health
Invoke-RestMethod https://homepage.example.com/api/ready
```

브라우저 확인:

```text
https://homepage.example.com/h/sample-korean-academy
https://homepage.example.com/internal
```

판정 기준:

- `/api/health` 통과
- `/api/ready` 통과
- 공개 홈페이지 새로고침 통과
- `/internal` 새로고침 통과
- asset 404 없음
- mixed content 오류 없음
- CORS 오류 없음
- `/api/*`가 SPA fallback으로 떨어지지 않음

---

## 14. Step 11: 로그와 장애 기록 확인

확인:

```powershell
Get-ChildItem C:/muksan-homepage/logs
```

판정 기준:

- backend stdout/stderr log 확인
- Caddy access log 확인
- log file이 checkout 또는 `frontend/dist`, `backend/dist` 아래에 있지 않다.
- secret, 실제 `.env`, 상담 문의 원문이 log에 남지 않는다.
- rotation 기준이 `docs/06_OPERATION_LOG_AND_INCIDENT_RUNBOOK.md`와 맞다.

P1 또는 P2 수준의 실패는 `docs/incidents/INCIDENT_TEMPLATE.md`를 복제해 기록한다.

---

## 15. GO / NO-GO

GO 조건:

- build, backup, migration 통과
- Caddy validation 통과
- backend 수동 실행 확인 통과
- service install 통과
- service start/stop/restart 통과
- Caddy run 또는 reload 통과
- HTTPS same-origin 확인 통과
- 테스트 상담 문의 접수와 내부 확인 통과
- log 생성과 secret 미노출 확인

NO-GO 조건:

- runtime 설정 파일에 placeholder가 남아 있음
- service start 실패
- service stop 후 port가 닫히지 않음
- restart 후 `/api/ready` 실패
- Caddy validation 실패
- HTTPS route 또는 SPA fallback 실패
- backend port가 public internet에 직접 노출됨
- log에 secret 또는 실제 개인정보가 남음

NO-GO이면 운영 반영을 중단하고 실패 단계, 로그 파일명, readiness 실패 check, 마지막 정상 커밋을 기록한다.

---

## 16. 아직 자동화하지 않은 항목

- Caddy 설치
- Windows Service wrapper 실행 파일 다운로드 또는 배치
- service install/start/stop/restart 자동 스크립트
- Caddy service 등록
- DNS와 실제 HTTPS 인증서 발급
- log cleanup task 등록
