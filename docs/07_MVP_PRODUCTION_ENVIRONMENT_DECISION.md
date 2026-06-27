# MVP 1차 운영 환경 결정

Status: Accepted for MVP rehearsal
Project: homepage
Last Updated: 2026-06-27

---

## 1. 결정

homepage MVP의 1차 운영 기준은 다음으로 고정한다.

```text
Windows 단일 서버
→ Caddy same-origin reverse proxy
→ backend Windows Service wrapper
→ frontend/dist 정적 파일
→ SQLite file DB
```

구체 기준:

| 항목 | 1차 기준 |
|---|---|
| OS | Windows 단일 서버 |
| reverse proxy | Caddy |
| backend process manager | Windows Service wrapper |
| frontend 배포 | `frontend/dist` 정적 파일 |
| backend bind | `HOST=127.0.0.1`, `PORT=4200` |
| public entry | same-origin HTTPS |
| DB | SQLite `file:` URL, checkout 밖 `C:/muksan-homepage/data` |
| backup | checkout 밖 `C:/muksan-homepage/backups` |
| logs | checkout 밖 `C:/muksan-homepage/logs` |

---

## 2. 이유

이 결정은 기술적으로 가장 확장성 높은 선택이 아니라, MVP 첫 운영을 가장 적은 운영 면적으로 안정화하기 위한 선택이다.

판단 근거:

- 현재 개발과 문서 명령이 Windows PowerShell, `npm.cmd`, `C:/muksan-homepage/*` 기준으로 정리되어 있다.
- 묵산은 1인 또는 극소수 운영 가능성을 중시한다.
- same-origin reverse proxy를 쓰면 frontend API base와 CORS 운영 부담이 줄어든다.
- Caddy는 MVP 단계에서 HTTPS와 reverse proxy 구성을 단순하게 만들 수 있다.
- backend는 terminal session이 아니라 service로 유지되어야 한다.
- SQLite는 현재 MVP 범위와 백업/복구 런북에 맞다.

---

## 3. 이번 결정에서 제외한 선택지

| 선택지 | 이번 MVP에서 보류하는 이유 |
|---|---|
| PM2 | Node 친화적이지만 Windows service 안정화와 부팅 자동화가 별도 과제가 된다. |
| Linux + systemd | 장기 운영 후보로 적합하지만, 현재 작업 흐름과 문서가 Windows 중심이다. |
| Docker/container | 배포 재현성은 좋지만 초기 운영자가 다룰 인프라 면적이 커진다. |
| frontend/backend 분리 origin | CORS, API base, 인증서, 장애 확인 지점이 늘어난다. |
| Nginx | Linux 운영 기준이면 적합하지만 Windows 1차 기준에서는 Caddy가 단순하다. |

이 선택지는 영구 배제가 아니다. 유료 고객 수, 서버 운영 역량, 자동 배포 필요성이 커지면 Linux + systemd 또는 container 운영으로 재검토한다.

---

## 4. 운영 디렉터리 표준

1차 운영 서버는 다음 디렉터리 구조를 사용한다.

```text
C:/muksan-homepage/app
C:/muksan-homepage/data
C:/muksan-homepage/backups
C:/muksan-homepage/logs
```

원칙:

- `app`은 checkout 또는 배포 artifact 위치다.
- `data`, `backups`, `logs`는 app 삭제나 재배포로 지워지지 않는다.
- `.env`, 운영 secret, DB 파일, backup 파일, log 파일은 Git에 커밋하지 않는다.
- SQLite DB는 `frontend/dist`, `backend/dist`, `.tmp` 아래에 두지 않는다.

---

## 5. Caddy 1차 기준

MVP는 same-origin HTTPS 기준이다.

```text
https://homepage.example.com
├─ /h/*       → frontend/dist SPA fallback
├─ /internal  → frontend/dist SPA fallback
├─ /assets/*  → frontend/dist/assets/*
└─ /api/*     → 127.0.0.1:4200
```

1차 운영에서는 `VITE_API_BASE_URL`을 생략하고 frontend가 같은 origin의 `/api`를 호출하게 한다.

---

## 6. Backend Service 1차 기준

Windows Service wrapper가 실행할 명령은 다음 기준을 따른다.

```powershell
npm.cmd --workspace backend run start
```

service 환경 변수:

```powershell
NODE_ENV=production
DATABASE_URL=file:C:/muksan-homepage/data/homepage-prod.db
HOMEPAGE_DB_BACKUP_DIR=C:/muksan-homepage/backups
HOMEPAGE_INTERNAL_ACCESS_TOKEN=<32자 이상 운영 비밀값>
HOST=127.0.0.1
PORT=4200
```

service 성공 판정:

- 서버 재부팅 후 backend 자동 시작
- 비정상 종료 시 재시작
- stdout/stderr 로그 보존
- `/api/health` 통과
- `/api/ready` 통과
- stop 후 `127.0.0.1:4200`이 응답하지 않음

---

## 7. 리허설 기준

실제 service 등록 전에는 기존 로컬 시뮬레이션을 통과해야 한다.

```powershell
npm.cmd run rehearse:local-production
```

그 다음 Windows service 방식으로 다음 lifecycle을 확인한다.

```text
service install 또는 등록
→ service start
→ /api/health
→ /api/ready
→ service stop
→ backend port close 확인
→ service start
→ /api/ready
→ Caddy reverse proxy 확인
```

이 단계가 실패하면 운영 배포는 `NO-GO`다.

---

## 8. 나중에 재검토할 조건

다음 조건 중 하나가 생기면 1차 운영 기준을 재검토한다.

- Windows 서버 운영이 Caddy/service/log rotation에서 반복적으로 막힌다.
- 유료 고객 수가 늘어 staging/production 분리가 필요하다.
- 무중단 배포, blue/green 배포, container image 배포가 필요하다.
- SQLite 운영 한계로 PostgreSQL 전환을 검토한다.
- 운영자가 Linux/systemd 또는 container 운영에 익숙해진다.

---

## 9. 아직 구현이 아닌 항목

이 문서는 결정 문서다. 다음은 아직 자동화하지 않았다.

- Windows Service wrapper 설정 파일 생성
- Caddyfile 실제 운영 파일 생성
- Windows log rotation 또는 cleanup task 등록
- 실제 운영 서버 provision
- 실제 도메인과 HTTPS 인증서 발급
