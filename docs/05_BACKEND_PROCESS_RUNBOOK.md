# Backend Process 운영 런북

Status: Draft
Project: homepage
Last Updated: 2026-06-26

---

## 1. 목적

이 문서는 homepage backend를 운영 환경에서 어떻게 시작, 중지, 재시작하고 로그를 확인할지 정의한다.

현재 문서는 특정 process manager를 설치했다는 뜻이 아니다. MVP 운영 전에 묵산이 선택할 process manager가 반드시 만족해야 할 기준과, process manager가 없을 때의 수동 리허설 절차를 고정한다.

---

## 2. 운영 원칙

운영 backend는 터미널에 직접 띄워 둔 일회성 프로세스로 장시간 운영하지 않는다.

process manager는 다음 역할을 맡아야 한다.

- 서버 재부팅 후 backend 자동 시작
- 비정상 종료 시 backend 재시작
- stdout/stderr 로그 보존
- 실행 사용자, working directory, 환경 변수 고정
- 운영자가 명시적으로 stop/restart 할 수 있는 명령 제공
- 재시작 후 `/api/health`, `/api/ready` 확인 가능

process manager 후보는 운영 서버 선택에 따라 정한다.

| 환경 | 후보 |
|---|---|
| Windows 단일 서버 | Windows Service wrapper 또는 Task Scheduler |
| Linux 단일 서버 | systemd |
| Node 중심 운영 | PM2 |
| 컨테이너 운영 | container runtime restart policy |

어느 방식을 쓰더라도 backend 실행 명령과 환경 변수 기준은 동일해야 한다.

---

## 3. Backend 실행 기준

process manager가 실행해야 할 backend 명령:

```powershell
npm.cmd --workspace backend run start
```

실제 실행 대상은 build 산출물이다.

```text
backend/dist/server.js
```

실행 전 필수 조건:

- `npm.cmd run build` 통과
- `npm.cmd run db:deploy` 통과
- `NODE_ENV=production`
- `DATABASE_URL` 명시
- `HOMEPAGE_INTERNAL_ACCESS_TOKEN` 32자 이상
- reverse proxy 운영이면 `HOST=127.0.0.1`
- `PORT`는 reverse proxy 설정과 일치
- working directory는 repository root 또는 배포 app root

운영 DB, backup directory, log directory는 checkout 삭제 대상 밖에 둔다.

---

## 4. 권장 운영 디렉터리

Windows 예:

```text
C:/muksan-homepage/app
C:/muksan-homepage/data
C:/muksan-homepage/backups
C:/muksan-homepage/logs
```

Linux 예:

```text
/opt/muksan-homepage/app
/var/lib/muksan-homepage
/var/backups/muksan-homepage
/var/log/muksan-homepage
```

로그 파일 권장 분리:

```text
backend-out.log
backend-error.log
reverse-proxy-access.log
reverse-proxy-error.log
```

로그에는 운영 내부 접근 토큰, 실제 `.env`, 상담 문의 원문을 의도적으로 출력하지 않는다.

---

## 5. 배포 시 프로세스 순서

신규 배포:

```text
build
→ db:deploy
→ process start
→ /api/health
→ /api/ready
→ reverse proxy 확인
```

기존 운영 서버에 재배포:

```text
traffic 전환 차단 또는 점검 시간 확보
→ process stop
→ db:backup
→ db:deploy
→ process start
→ /api/health
→ /api/ready
→ public route 확인
→ traffic 전환
```

SQLite MVP에서는 migration 직전 backend를 중지하는 방식을 기본으로 한다. 상담 문의가 들어오는 중에 DB 파일을 복사하거나 schema migration을 적용하지 않는다.

---

## 6. Start / Stop / Restart 판정

start 성공 기준:

- process manager 상태가 running이다.
- `http://127.0.0.1:4200/api/health`가 HTTP `200`을 반환한다.
- `http://127.0.0.1:4200/api/ready`가 HTTP `200`, `ok: true`를 반환한다.
- 로그에 DB 초기화, seed 로드, listen 실패가 없다.

stop 성공 기준:

- process manager 상태가 stopped다.
- backend port가 더 이상 응답하지 않는다.
- SQLite `-wal`, `-shm`, `-journal` 파일이 남아 있으면 백업 전 원인을 확인한다.

restart 성공 기준:

- stop 성공 기준을 먼저 만족한다.
- start 성공 기준을 다시 만족한다.
- `/api/ready` 실패가 있으면 traffic을 전환하지 않는다.

확인 명령 예:

```powershell
Invoke-RestMethod http://127.0.0.1:4200/api/health
Invoke-RestMethod http://127.0.0.1:4200/api/ready
```

---

## 7. 로컬 Process Lifecycle 리허설

`npm.cmd run rehearse:local-production`은 production build 산출물로 backend를 시작하고 health/readiness를 확인한 뒤 프로세스를 종료한다. 이는 운영 process manager를 대체하지 않지만, process lifecycle의 최소 조건을 자동으로 확인한다.

process manager 등록 전에는 다음 수동 리허설도 수행한다.

1. 리허설 전용 `DATABASE_URL`, `HOMEPAGE_DB_BACKUP_DIR`, `HOMEPAGE_INTERNAL_ACCESS_TOKEN`을 설정한다.
2. `npm.cmd run build`를 실행한다.
3. `npm.cmd run db:deploy`를 실행한다.
4. 별도 터미널에서 `npm.cmd --workspace backend run start`를 실행한다.
5. `/api/health`, `/api/ready`를 확인한다.
6. 프로세스를 중지한다.
7. backend port가 응답하지 않는지 확인한다.
8. 같은 명령으로 다시 시작한다.
9. `/api/ready`가 다시 통과하는지 확인한다.
10. stdout/stderr 로그가 운영 log directory에 남는지 확인한다.

이 수동 리허설이 실패하면 process manager 등록 전 단계에서 `NO-GO`로 판단한다.

---

## 8. 장애 시 1차 대응

backend가 응답하지 않을 때:

1. process manager 상태를 확인한다.
2. 최근 backend error log를 확인한다.
3. `DATABASE_URL` 대상 파일과 부모 directory 권한을 확인한다.
4. `/api/health`와 `/api/ready`를 각각 확인한다.
5. `/api/health`는 통과하고 `/api/ready`만 실패하면 readiness check의 실패 항목을 먼저 본다.
6. 재시작 전 마지막 정상 백업 파일을 확인한다.
7. 재시작 후 상담 문의 테스트는 실제 개인정보가 아닌 테스트 데이터로만 수행한다.

즉시 재시작만 반복하지 않는다. 같은 오류로 재시작 루프가 발생하면 traffic 전환을 막고 로그와 readiness 응답을 보존한다.

---

## 9. 아직 구현이 아닌 항목

이 런북은 기준 문서다. 다음은 아직 자동화하지 않았다.

- process manager 설정 파일 생성
- Windows Service 또는 systemd unit 등록
- 로그 rotation 설정
- 외부 uptime monitoring
- 장애 알림 발송
- 무중단 배포
