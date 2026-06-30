# 로컬 시연 포트 정책 결정

Status: Draft
Project: homepage
Last Updated: 2026-06-30

---

## 1. 결정

homepage 프로젝트의 공식 로컬 시연 frontend 포트는 `5175`로 유지한다.

`5176`은 공식 로컬 시연 URL로 승격하지 않는다.

판정:

```text
공식 로컬 시연 URL: http://127.0.0.1:5175/h/sample-korean-academy
대체 포트 5176: TEMPORARY ONLY
5175 충돌 상태: HOLD
Vite 자동 대체 포트: BLOCK
```

---

## 2. 이유

`5175`를 유지하는 이유:

- 최초 MVP 지시에서 frontend 포트를 `5175`로 정했다.
- README, QA 문서, 브라우저 확인 흐름이 `5175`를 기준으로 정리되어 있다.
- Vite가 자동으로 `5176`으로 밀리면 문서 URL과 실제 URL이 달라진다.
- backend 개발 CORS 기본 허용 origin도 `5175`를 기준으로 되어 있다.
- 다른 workspace가 `5175`를 점유하면 묵산이 엉뚱한 화면을 보고 시각 판정할 위험이 있다.

따라서 자동 대체 포트는 편리하지만, 시연 안정성 측면에서는 위험하다.

---

## 3. 구현 결정

frontend dev/preview는 strict port로 실행한다.

적용 기준:

```text
vite --host 127.0.0.1 --port 5175 --strictPort
vite preview --host 127.0.0.1 --port 5175 --strictPort
```

`frontend/vite.config.ts`에도 `server.strictPort`와 `preview.strictPort`를 둔다.

이제 `5175`가 다른 프로세스에 의해 점유되어 있으면 homepage frontend는 `5176`으로 자동 이동하지 않고 실패해야 한다.

실패하면 `npm.cmd run demo:ports`로 점유 프로세스를 확인하고, 시연은 HOLD한다.

2026-06-30 확인:

```text
npm.cmd run demo:ports
-> 5175 academy frontend 점유 감지, HOLD

npm.cmd --workspace frontend run dev
-> Error: Port 5175 is already in use
```

위 결과는 기대 동작이다. homepage frontend가 `5176`으로 자동 이동하지 않았다.

---

## 4. 5176 사용 기준

`5176`을 완전히 금지하지는 않는다.

다만 다음 조건을 모두 만족할 때만 임시 검증용으로 쓴다.

- 이 대화창에서 `5176`을 임시 검증 URL로 사용한다고 명시한다.
- backend를 `HOMEPAGE_CORS_ORIGINS`로 `5176` origin에 맞춰 재실행한다.
- 보고서에 `5175`가 아니라 `5176`에서 검증했다는 사실을 남긴다.
- 묵산 시각 판정 요청에는 실제 URL과 포트 상태를 명확히 쓴다.
- 외부 공유 URL 또는 공식 로컬 시연 URL로 부르지 않는다.

예시:

```powershell
$env:HOMEPAGE_CORS_ORIGINS="http://127.0.0.1:5176,http://localhost:5176"
npm.cmd run dev:backend
npm.cmd --workspace frontend run dev -- --port 5176 --strictPort
```

이 방식은 임시 검증 절차다.

일반 README 실행 순서의 기본값은 아니다.

---

## 5. 묵산 시각 판정 기준

묵산에게 시각 판정을 요청하려면 다음 조건이 필요하다.

| 조건 | 필요 판정 |
|---|---|
| `npm.cmd run demo:ports` | PASS |
| frontend URL | 실제 homepage URL로 확인됨 |
| backend health/readiness | PASS |
| 공개 샘플 홈페이지 | `/h/sample-korean-academy` 렌더링 |
| 내부 화면 | 외부 판정 대상이 아님 |

`demo:ports`가 HOLD이면 묵산에게 시각 판정을 요청하지 않는다.

---

## 6. 다음 작업

다음 1순위 추천 작업은 로컬 시연 포트 정책 결정 변경분 커밋/푸시다.

커밋 후 추천 작업은 현재 PC의 `5175` 충돌을 실제로 해소할지, 아니면 이번 세션에서는 묵산에게 `5176` 임시 검증 URL을 명시하고 시각 판정을 요청할지 결정하는 것이다.
