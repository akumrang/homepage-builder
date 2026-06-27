# 운영 호스팅 / Reverse Proxy 구성안

Status: Draft
Project: homepage
Last Updated: 2026-06-27

---

## 1. 목적

이 문서는 homepage MVP를 실제 운영 서버에 올릴 때 필요한 호스팅과 reverse proxy 구성 기준을 정의한다.

현재 목표는 고객별 커스텀 도메인 전체 자동화가 아니다. 먼저 묵산이 통제하는 표준 운영 경로에서 다음을 안정적으로 제공하는 것이 목적이다.

- `frontend/dist` 정적 파일 제공
- backend Express API reverse proxy
- HTTPS 적용
- `/api/health`, `/api/ready` 운영 확인
- SQLite DB와 backup directory를 배포 산출물 밖에 보관

---

## 2. 권장 운영 구조

MVP 1차 운영은 same-origin reverse proxy를 권장한다.

MVP 1차 운영 환경 결정은 `docs/07_MVP_PRODUCTION_ENVIRONMENT_DECISION.md`를 따른다. 현재 1차 기준은 Windows 단일 서버, Caddy, Windows Service wrapper다.
실제 Caddyfile 초안은 `deploy/windows/Caddyfile.template`에 둔다.
Windows 운영 수동 리허설은 `docs/09_WINDOWS_OPERATION_REHEARSAL_CHECKLIST.md`를 따른다.

```text
https://homepage.example.com
├─ /h/sample-korean-academy  → frontend/dist SPA fallback
├─ /internal                 → frontend/dist SPA fallback
├─ /assets/*                 → frontend/dist/assets/*
└─ /api/*                    → backend Express :4200
```

이 구조의 장점:

- production frontend build에서 `VITE_API_BASE_URL`을 생략할 수 있다.
- 브라우저 CORS 부담이 줄어든다.
- `/api`와 화면이 같은 HTTPS origin에서 제공된다.
- 리허설 스크립트의 same-origin `/api` 프록시 확인과 구조가 맞다.

분리 origin 구조는 다음 조건에서만 쓴다.

- frontend 정적 호스팅과 backend API 호스팅이 물리적으로 분리되어야 한다.
- frontend build 전에 `VITE_API_BASE_URL`을 정확히 지정할 수 있다.
- backend `HOMEPAGE_CORS_ORIGINS`에 frontend origin을 명시할 수 있다.

---

## 3. 운영 디렉터리 기준

예시:

```text
C:/muksan-homepage/app              # checkout 또는 배포된 app
C:/muksan-homepage/data             # SQLite 운영 DB
C:/muksan-homepage/backups          # SQLite backup
C:/muksan-homepage/logs             # process/reverse proxy log
```

Linux 대안:

```text
/opt/muksan-homepage/app
/var/lib/muksan-homepage
/var/backups/muksan-homepage
/var/log/muksan-homepage
```

원칙:

- 운영 DB는 `frontend/dist`, `backend/dist`, `.tmp`, checkout 삭제 대상 안에 두지 않는다.
- backup directory는 운영 DB와 같은 일괄 삭제 대상에 두지 않는다.
- `.env` 또는 secret 파일은 Git에 커밋하지 않는다.
- reverse proxy가 접근하는 정적 파일 경로는 `frontend/dist`다.

---

## 4. Backend 운영 환경 변수

same-origin reverse proxy 기준 예:

```powershell
$env:NODE_ENV="production"
$env:DATABASE_URL="file:C:/muksan-homepage/data/homepage-prod.db"
$env:HOMEPAGE_DB_BACKUP_DIR="C:/muksan-homepage/backups"
$env:HOMEPAGE_INTERNAL_ACCESS_TOKEN="replace-with-at-least-32-random-characters"
$env:HOST="127.0.0.1"
$env:PORT="4200"
```

same-origin 구조에서는 `HOMEPAGE_CORS_ORIGINS`를 생략할 수 있다. 같은 origin 요청은 브라우저 CORS 검사를 필요로 하지 않는다.

분리 origin 기준 예:

```powershell
$env:HOMEPAGE_CORS_ORIGINS="https://homepage.example.com"
$env:VITE_API_BASE_URL="https://api-homepage.example.com"
```

주의:

- `HOMEPAGE_CORS_ORIGINS`에는 origin만 넣는다. 경로, query, hash, `*`는 쓰지 않는다.
- `HOMEPAGE_INTERNAL_ACCESS_TOKEN`은 운영에서 32자 이상이어야 하며, 개발 기본 키는 사용할 수 없다.
- 운영 backend port는 public internet에 직접 열지 않는다. reverse proxy 또는 firewall 뒤에 둔다.
- 현재 backend는 `HOST`와 `PORT` 기준으로 listen한다. reverse proxy 운영에서는 `HOST=127.0.0.1`을 유지한다.
- 컨테이너나 별도 네트워크 경계가 필요한 경우에만 `HOST=0.0.0.0`을 검토한다.

---

## 5. 배포 순서

신규 배포 순서:

```powershell
npm.cmd install
npm.cmd run verify
npm.cmd run build
npm.cmd run db:deploy
# process manager start
```

기존 운영 서버 재배포 순서:

```powershell
npm.cmd run verify
npm.cmd run build
# process manager stop
npm.cmd run db:backup
npm.cmd run db:deploy
# process manager start
```

확인:

```powershell
Invoke-RestMethod http://localhost:4200/api/health
Invoke-RestMethod http://localhost:4200/api/ready
```

process manager 시작, 중지, 재시작 판정은 `docs/05_BACKEND_PROCESS_RUNBOOK.md`를 따른다.

reverse proxy 반영 후:

```text
https://homepage.example.com/api/health
https://homepage.example.com/api/ready
https://homepage.example.com/h/sample-korean-academy
https://homepage.example.com/internal
```

---

## 6. Reverse Proxy 라우팅 규칙

필수 규칙:

- `/api/*`는 backend로 proxy한다.
- `/assets/*`는 `frontend/dist/assets/*` 정적 파일을 제공한다.
- 그 외 SPA route는 `frontend/dist/index.html`로 fallback한다.
- `/api/*`에는 정적 파일 fallback을 적용하지 않는다.
- `/api/health`, `/api/ready`에는 캐시를 적용하지 않는다.
- HTTPS를 적용한다.

권장 cache 기준:

| 경로 | 기준 |
|---|---|
| `/api/*` | no-store |
| `/assets/*` | 긴 cache 가능. Vite hash asset 전제 |
| `/h/*`, `/internal`, `/` | 짧은 cache 또는 no-cache |

---

## 7. Caddy 예시

MVP 1차 운영의 reverse proxy 기준은 Caddy다.
복제용 템플릿은 `deploy/windows/Caddyfile.template`이다.

예시일 뿐이며, 실제 경로와 도메인은 운영 서버에 맞게 바꾼다.

```caddyfile
homepage.example.com {
  encode gzip

  handle /api/* {
    reverse_proxy 127.0.0.1:4200
    header Cache-Control "no-store"
  }

  handle /assets/* {
    root * C:/muksan-homepage/app/frontend/dist
    file_server
    header Cache-Control "public, max-age=31536000, immutable"
  }

  handle {
    root * C:/muksan-homepage/app/frontend/dist
    try_files {path} /index.html
    file_server
    header Cache-Control "no-cache"
  }
}
```

확인:

```powershell
Invoke-RestMethod https://homepage.example.com/api/ready
```

---

## 8. Nginx 예시

Nginx는 Linux 운영으로 전환할 때의 대안 예시다. MVP 1차 기준은 아니다.

예시일 뿐이며, 실제 경로와 도메인은 운영 서버에 맞게 바꾼다.

```nginx
server {
  listen 443 ssl http2;
  server_name homepage.example.com;

  root /opt/muksan-homepage/app/frontend/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:4200;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    add_header Cache-Control "no-store" always;
  }

  location /assets/ {
    try_files $uri =404;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
  }

  location / {
    try_files $uri /index.html;
    add_header Cache-Control "no-cache" always;
  }
}
```

HTTP `80`은 HTTPS로 redirect한다. 인증서 발급과 갱신 방식은 운영 서버 선택에 맞게 별도로 정한다.

---

## 9. 배포 후 확인

필수 확인:

- `https://homepage.example.com/api/health`가 HTTP `200`, `ok: true`
- `https://homepage.example.com/api/ready`가 HTTP `200`, `ok: true`
- `/h/sample-korean-academy` 첫 화면 로드
- `/internal` 화면 로드
- asset 404 없음
- 상담 문의 테스트 접수
- 내부 화면에서 테스트 문의 확인
- backend port가 외부에서 직접 열려 있지 않음
- backend가 reverse proxy 뒤에서 `127.0.0.1:4200` 또는 동등한 내부 주소에만 bind됨
- reverse proxy access/error log가 checkout 삭제 대상 밖에 남음
- reverse proxy log rotation 또는 보관 기간 정책 확인

브라우저 확인:

- CORS 오류 없음
- mixed content 오류 없음
- `frontend/dist` asset이 HTTPS로 로드됨
- 새로고침으로 `/h/sample-korean-academy`, `/internal`이 유지됨

---

## 10. 운영 판단

GO 조건:

- local production rehearsal 통과
- 운영 또는 staging reverse proxy에서 `/api/ready` 통과
- 공개 홈페이지 route 새로고침 통과
- 상담 문의 접수 통과
- DB backup 생성 확인
- HTTPS 적용 확인
- backend process manager start/restart 기준 확인
- 운영 로그 rotation 기준 확인

NO-GO 조건:

- `/api/ready` 실패
- `/api/*`가 frontend fallback으로 떨어짐
- SPA route 새로고침 시 404 발생
- asset 404 발생
- CORS 또는 mixed content 오류 발생
- backend port가 외부에 직접 노출됨

---

## 11. 아직 구현이 아닌 항목

이 문서는 구성안이다. 다음 항목은 아직 자동화하지 않았다.

- 서버 provision
- reverse proxy 설정 파일 자동 생성
- HTTPS 인증서 자동 발급/갱신
- process manager 설정 파일 자동 생성
- reverse proxy log rotation 설정 파일 자동 생성
- Windows Service wrapper 설정 파일 자동 생성
- 배포 artifact 업로드
- custom domain 자동 연결
- 외부 모니터링과 알림
