# 로컬 시연 포트 충돌 사전점검 절차

Status: Draft
Project: homepage
Last Updated: 2026-06-30

---

## 1. 목적

이 문서는 로컬 시연 전에 `5175`와 `4200` 포트가 homepage 프로젝트에 맞게 비어 있거나 올바른 프로세스가 점유하고 있는지 확인하는 절차를 정의한다.

최근 브라우저 확인에서 `5175` 포트가 homepage가 아니라 `academy/frontend`에 의해 점유되어 있었다. 그 상태에서 `http://127.0.0.1:5175/h/sample-korean-academy`를 열면 homepage 샘플이 아니라 다른 화면이 나온다.

이 절차의 목적은 묵산이 잘못된 화면을 보고 시각 판정을 하지 않게 만드는 것이다.

---

## 2. 기준 포트

| 영역 | 기본 포트 | 기준 |
|---|---:|---|
| frontend | `5175` | homepage Vite dev server |
| backend | `4200` | homepage Express backend |

기본 확인 URL:

```text
http://127.0.0.1:5175/h/sample-korean-academy
http://127.0.0.1:5175/internal
http://localhost:4200/api/health
http://localhost:4200/api/ready
```

---

## 3. 자동 사전점검 명령

로컬 시연 전에 저장소 root에서 다음 명령을 먼저 실행한다.

```powershell
npm.cmd run demo:ports
```

이 명령은 Windows 로컬 환경에서 다음을 확인한다.

- `5175` 포트가 비어 있는지
- `5175` 포트를 점유한 프로세스가 homepage workspace인지
- `4200` 포트가 비어 있는지
- `4200` 포트를 점유한 프로세스가 homepage workspace인지
- 다른 workspace나 다른 앱이 점유 중이면 `HOLD`로 실패

---

## 4. PASS 기준

다음 중 하나면 PASS다.

| 상황 | 판정 |
|---|---|
| `5175`가 비어 있음 | PASS |
| `5175`가 homepage workspace의 Vite 서버임 | PASS |
| `4200`이 비어 있음 | PASS |
| `4200`이 homepage workspace의 backend 서버임 | PASS |

PASS 예시:

```text
[demo:ports] PASS frontend port 5175 is free.
[demo:ports] PASS backend port 4200 is already used by this homepage workspace.
[demo:ports] PASS local demo ports are safe to use for this workspace.
```

---

## 5. HOLD 기준

다음 상황이면 즉시 HOLD다.

| 상황 | 판정 |
|---|---|
| `5175`가 academy 또는 다른 workspace 프로세스임 | HOLD |
| `4200`이 homepage가 아닌 다른 backend임 | HOLD |
| `5175` 기본 URL을 열었는데 homepage 샘플이 아닌 화면이 보임 | HOLD |
| frontend가 `5175` strict port로 실행되지 못함 | HOLD |

HOLD 상태에서는 묵산에게 시각 판정을 요청하지 않는다.

먼저 실제로 어떤 URL이 homepage를 가리키는지 확정해야 한다.

---

## 6. 대체 포트 사용 절차

`5175`가 다른 workspace에서 이미 사용 중이면 공식 로컬 시연은 HOLD한다.

`5176` 같은 대체 포트는 공식 로컬 시연 URL이 아니다. 이 대화창에서 명시적으로 임시 검증 URL로 선언한 경우에만 사용한다.

이 경우 backend를 대체 포트 origin으로 허용해 다시 실행해야 한다.

예시:

```powershell
$env:HOMEPAGE_CORS_ORIGINS="http://127.0.0.1:5176,http://localhost:5176"
npm.cmd run dev:backend
npm.cmd --workspace frontend run dev -- --port 5176 --strictPort
```

그 다음 실제 시연 URL은 다음처럼 명시한다.

```text
http://127.0.0.1:5176/h/sample-korean-academy
```

이때 `5175` 문서 기본 URL과 실제 검증 URL이 다르다는 사실을 보고서와 이 대화창에 남긴다.

---

## 7. 수동 확인 명령

자동 명령 외에 PowerShell에서 직접 확인하려면 다음 명령을 사용한다.

```powershell
Get-NetTCPConnection -LocalPort 5175,4200 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress,LocalPort,State,OwningProcess
```

프로세스 명령줄 확인:

```powershell
Get-CimInstance Win32_Process -Filter "ProcessId = <PID>" |
  Select-Object ProcessId,CommandLine,ExecutablePath
```

`CommandLine`에 다음 경로가 포함되어야 homepage workspace로 판단한다.

```text
C:\Users\akumr\Bettle\withgpt\homepage
```

---

## 8. 시연 전 체크 순서

권장 순서:

1. `npm.cmd run demo:ports`
2. HOLD가 나오면 시연 중단
3. 필요한 경우 다른 workspace 프로세스 종료 여부를 묵산이 판단
4. frontend/backend 실행
5. 실제 frontend URL 확인
6. backend health/readiness 확인
7. 공개 샘플 홈페이지 접속
8. 상담 문의 테스트
9. 내부 화면에서 테스트 문의 확인

---

## 9. 다음 작업

README 실행 순서와 묵산 시각 판정 전 대화창 안내 문구는 정리했다.

다음 1순위 추천 작업은 README 시각 판정 안내 변경분 커밋/푸시다.

커밋 후 추천 작업은 현재 PC의 `5175` 충돌을 실제로 해소할지, 아니면 이번 세션에서는 묵산에게 `5176` 임시 검증 URL을 명시하고 시각 판정을 요청할지 결정하는 것이다.
