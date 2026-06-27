# Windows Caddy / Service 템플릿 초안

Status: Draft
Project: homepage
Last Updated: 2026-06-27

---

## 1. 목적

이 문서는 MVP 1차 운영 기준인 Windows 단일 서버, Caddy same-origin reverse proxy, Windows Service wrapper에 맞춘 실제 설정 초안을 정의한다.

템플릿은 다음 위치에 둔다.

| 템플릿 | 용도 |
|---|---|
| `deploy/windows/Caddyfile.template` | Caddy reverse proxy 설정 초안 |
| `deploy/windows/muksan-homepage-backend.winsw.xml.template` | WinSW 계열 Windows Service wrapper 설정 초안 |

이 파일들은 운영 secret을 포함하지 않는 복제용 템플릿이다. 실제 운영 파일은 서버에서 복사해 값을 교체한 뒤 사용한다.

---

## 2. 교체해야 할 값

Caddyfile:

- `admin@example.com`: 운영 인증서/알림용 이메일
- `homepage.example.com`: 운영 도메인
- `C:/muksan-homepage/app/frontend/dist`: 실제 frontend dist 경로
- `127.0.0.1:4200`: backend bind host/port
- `C:/muksan-homepage/logs/caddy-access.log`: reverse proxy access log 경로

Windows Service wrapper:

- `C:\Program Files\nodejs\node.exe`: 운영 서버의 Node 실행 파일 경로
- `C:\muksan-homepage\app`: app root
- `C:\muksan-homepage\app\backend\dist\server.js`: backend build entry
- `REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS`: 운영 내부 접근 토큰
- `DATABASE_URL`, `HOMEPAGE_DB_BACKUP_DIR`, `logpath`: 운영 서버 표준 디렉터리

운영 내부 접근 토큰은 템플릿에 실제 값을 넣어 커밋하지 않는다.

---

## 3. 운영 파일 배치 기준

권장 운영 배치:

```text
C:/muksan-homepage/app
C:/muksan-homepage/data
C:/muksan-homepage/backups
C:/muksan-homepage/logs
C:/muksan-homepage/runtime
```

권장 복사 위치:

```text
C:/muksan-homepage/runtime/Caddyfile
C:/muksan-homepage/runtime/muksan-homepage-backend.xml
```

`runtime` 아래 파일은 서버 운영 파일이므로 Git에 커밋하지 않는다. 저장소의 `deploy/windows/*.template`만 버전 관리한다.

---

## 4. Caddy 검증 순서

운영 서버에서 템플릿을 복사한 뒤 도메인과 경로를 바꾼다.

```powershell
Copy-Item C:/muksan-homepage/app/deploy/windows/Caddyfile.template C:/muksan-homepage/runtime/Caddyfile
```

검증:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageCaddy.ps1 -Action validate
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageCaddy.ps1 -Action run
```

reverse proxy 확인:

```powershell
Invoke-RestMethod https://homepage.example.com/api/health
Invoke-RestMethod https://homepage.example.com/api/ready
```

GO 기준:

- Caddy config validation 통과
- `/api/health`, `/api/ready`가 HTTPS origin에서 통과
- `/h/sample-korean-academy` 새로고침 통과
- `/internal` 새로고침 통과
- `/api/*`가 frontend fallback으로 떨어지지 않음
- `C:/muksan-homepage/logs/caddy-access.log` 생성

---

## 5. Windows Service wrapper 검증 순서

서비스 wrapper는 WinSW 계열 XML 초안을 기준으로 한다. 실제 wrapper 실행 파일은 운영 서버에서 별도로 준비한다.

권장 배치 예:

```text
C:/muksan-homepage/runtime/muksan-homepage-backend.exe
C:/muksan-homepage/runtime/muksan-homepage-backend.xml
```

템플릿 복사:

```powershell
Copy-Item C:/muksan-homepage/app/deploy/windows/muksan-homepage-backend.winsw.xml.template C:/muksan-homepage/runtime/muksan-homepage-backend.xml
```

서비스 등록 전 확인:

```powershell
npm.cmd run build
npm.cmd run db:deploy
node C:/muksan-homepage/app/backend/dist/server.js
```

별도 PowerShell에서:

```powershell
Invoke-RestMethod http://127.0.0.1:4200/api/health
Invoke-RestMethod http://127.0.0.1:4200/api/ready
```

수동 확인이 끝나면 node 프로세스를 종료하고 service wrapper로 등록한다.

GO 기준:

- service start 후 backend가 `127.0.0.1:4200`에서 응답
- service stop 후 backend port가 응답하지 않음
- service restart 후 `/api/ready` 재통과
- stdout/stderr 로그가 `C:/muksan-homepage/logs` 아래에 남음
- 실제 내부 접근 토큰이 32자 이상이며 템플릿 placeholder가 아님

---

## 6. 배포 리허설에 추가할 확인

기존 명령:

```powershell
npm.cmd run rehearse:local-production
```

추가 수동 확인:

1. `Caddyfile.template`을 운영 경로로 복사해 도메인과 경로를 교체한다.
2. Caddy validation을 실행한다.
3. service wrapper XML을 운영 경로로 복사해 secret과 경로를 교체한다.
4. service start, stop, restart를 확인한다.
5. Caddy를 통해 `/api/ready`와 SPA route 새로고침을 확인한다.
6. 로그 파일 생성과 rotation 기준을 확인한다.

service install/start/stop/restart와 Caddy validation의 상세 수동 절차는 `docs/09_WINDOWS_OPERATION_REHEARSAL_CHECKLIST.md`를 따른다.

---

## 7. Runtime 사전점검 스크립트

운영 서버에서 Caddy validation과 service install 전에 runtime 설정 파일의 placeholder와 필수 경로를 먼저 확인한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Test-MuksanHomepageRuntime.ps1
```

이 스크립트는 다음을 확인한다.

- runtime `Caddyfile`과 service XML 존재
- `frontend/dist`, `backend/dist/server.js` 존재
- Caddyfile의 `/api/*` reverse proxy와 SPA fallback
- service XML의 `NODE_ENV`, `DATABASE_URL`, `HOMEPAGE_INTERNAL_ACCESS_TOKEN`, `HOST`, `PORT`
- 운영 내부 접근 토큰 placeholder 제거와 32자 이상 기준
- log directory와 backup directory가 표준 경로인지

템플릿 자체의 문법만 확인할 때는 다음처럼 placeholder와 path check를 명시적으로 허용한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File deploy/windows/Test-MuksanHomepageRuntime.ps1 -CaddyfilePath deploy/windows/Caddyfile.template -ServiceXmlPath deploy/windows/muksan-homepage-backend.winsw.xml.template -AllowTemplatePlaceholders -SkipPathChecks
```

---

## 8. Service 조작 보조 스크립트

Windows Service wrapper 명령을 같은 방식으로 실행하기 위해 보조 스크립트를 둔다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageService.ps1 -Action status
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageService.ps1 -Action install
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageService.ps1 -Action start
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageService.ps1 -Action stop
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageService.ps1 -Action restart
```

로컬 또는 문서 검증 단계에서는 실제 service를 건드리지 않도록 `-DryRun`을 사용한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File deploy/windows/Invoke-MuksanHomepageService.ps1 -Action status -DryRun -SkipPathChecks
```

---

## 9. Caddy 조작 보조 스크립트

Caddy 명령도 같은 방식으로 실행하기 위해 보조 스크립트를 둔다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageCaddy.ps1 -Action version
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageCaddy.ps1 -Action validate
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageCaddy.ps1 -Action fmt
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageCaddy.ps1 -Action run
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/muksan-homepage/app/deploy/windows/Invoke-MuksanHomepageCaddy.ps1 -Action reload
```

로컬 또는 문서 검증 단계에서는 실제 Caddy를 실행하지 않도록 `-DryRun`을 사용한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File deploy/windows/Invoke-MuksanHomepageCaddy.ps1 -Action validate -DryRun -SkipPathChecks
```

---

## 10. 보안 기준

- 실제 `HOMEPAGE_INTERNAL_ACCESS_TOKEN`은 저장소에 커밋하지 않는다.
- 운영 `.env`, runtime service XML, runtime Caddyfile은 서버 전용 파일로 관리한다.
- backend port `4200`은 public internet에 직접 노출하지 않는다.
- Caddy는 HTTPS entrypoint로만 public traffic을 받는다.
- 상담 문의 원문과 보호자 연락처 전체를 service log 또는 Caddy log에 남기지 않는다.

---

## 11. 아직 구현이 아닌 항목

이 문서는 템플릿 초안이다. 다음은 아직 자동화하지 않았다.

- Caddy 설치 자동화
- Windows Service wrapper 실행 파일 배치
- 운영 secret 주입 자동화
- log cleanup task 등록
- 실제 도메인 인증서 발급 리허설
