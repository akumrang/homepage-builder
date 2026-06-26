# 운영 로그 / 장애 기록 런북

Status: Draft
Project: homepage
Last Updated: 2026-06-27

---

## 1. 목적

이 문서는 homepage MVP 운영에서 로그를 어떻게 보관, 회전, 확인하고 장애 기록을 어떤 형식으로 남길지 정의한다.

현재 문서는 외부 로그 수집기나 알림 시스템을 설치했다는 뜻이 아니다. 실제 운영 서버를 열기 전에 1인 또는 극소수 운영자가 최소한의 원인 추적과 복구 판단을 할 수 있도록 운영 기록 기준을 고정한다.

---

## 2. 로그 보관 원칙

로그는 운영 DB, backup directory와 마찬가지로 checkout 삭제 대상 밖에 둔다.

권장 경로:

```text
C:/muksan-homepage/logs
/var/log/muksan-homepage
```

필수 로그:

| 로그 | 목적 |
|---|---|
| `backend-out.log` | backend 정상 시작, health/readiness 관련 stdout |
| `backend-error.log` | backend stderr, 예외, listen 실패, DB 연결 실패 |
| `reverse-proxy-access.log` | 공개 route, `/api/*`, status code 확인 |
| `reverse-proxy-error.log` | HTTPS, proxy, static file fallback 오류 |
| `deployment-rehearsal.log` | 배포 리허설 실패 단계와 명령 결과 요약 |

로그에는 다음 값을 남기지 않는다.

- `HOMEPAGE_INTERNAL_ACCESS_TOKEN`
- 실제 `.env` 전체 내용
- 상담 문의 원문
- 보호자 연락처 전체
- 운영 DB 파일 원본
- 백업 파일 원본

상담 문의 확인이 필요할 때는 내부 화면이나 DB 백업 관리 절차를 따른다. 로그로 개인정보를 복제하지 않는다.

---

## 3. 로그 Rotation 기준

MVP 운영 최소 기준:

| 항목 | 기준 |
|---|---|
| 회전 단위 | 1일 1회 또는 파일 20MB 초과 시 |
| 보관 기간 | 최근 14일 |
| 압축 | 가능하면 회전 후 압축 |
| 삭제 | 14일 초과 로그는 삭제. 단, 장애 관련 로그는 incident record와 함께 별도 보관 가능 |
| 대상 | backend stdout/stderr, reverse proxy access/error |

파일명 예:

```text
backend-out-20260627.log
backend-error-20260627.log
reverse-proxy-access-20260627.log
reverse-proxy-error-20260627.log
```

rotation 적용 전 확인:

- 새 로그 파일에 process manager와 reverse proxy가 계속 쓸 수 있는지 확인한다.
- rotation 후 `/api/health`, `/api/ready`를 확인한다.
- 로그 directory 용량이 운영 DB 저장 공간을 압박하지 않는지 확인한다.
- rotated log에 secret이나 상담 문의 원문이 들어가지 않았는지 spot check한다.

---

## 4. 운영 중 로그 확인 순서

장애 의심 시 먼저 확인할 순서:

1. `/api/health`
2. `/api/ready`
3. backend process manager 상태
4. `backend-error.log`
5. `backend-out.log`
6. `reverse-proxy-error.log`
7. `reverse-proxy-access.log`
8. 최근 배포 리허설 기록
9. 마지막 DB backup manifest

readiness 실패이면 `/api/ready` 응답의 실패 check 이름을 장애 기록에 남긴다.

reverse proxy 문제이면 다음을 구분한다.

- `/api/*`가 backend로 proxy되지 않는 문제
- SPA route가 `index.html` fallback을 받지 못하는 문제
- HTTPS 또는 mixed content 문제
- backend port가 외부에 직접 열려 있는 문제

---

## 5. 장애 등급

운영 기록을 남길 때 다음 등급을 사용한다.

| 등급 | 기준 |
|---|---|
| P1 | 공개 홈페이지 전체 접속 불가, 상담 문의 접수 불가, 운영 DB 손상 의심 |
| P2 | 특정 route 또는 내부 화면 장애, 공지/문의 상태 변경 불가 |
| P3 | 일시적 오류, 로그 경고, 성능 저하, 운영자 수동 조치로 우회 가능 |

P1은 즉시 traffic 전환 또는 게시 중단 여부를 판단한다. P2는 당일 복구를 원칙으로 한다. P3는 다음 배포 또는 운영 점검 항목에 넣는다.

---

## 6. 장애 기록 양식

장애가 P1 또는 P2이면 다음 양식을 남긴다.

```markdown
# Incident: YYYY-MM-DD homepage <short title>

## Summary
- Severity: P1 / P2 / P3
- Status: open / mitigated / resolved
- Started at: YYYY-MM-DD HH:mm KST
- Detected at: YYYY-MM-DD HH:mm KST
- Resolved at:
- Reporter:
- Owner:

## Impact
- Affected surface: public homepage / inquiry API / internal screen / notice / database / reverse proxy
- Affected URL:
- User impact:
- Data loss suspected: yes / no / unknown
- Personal data exposure suspected: yes / no / unknown

## Current Signals
- /api/health:
- /api/ready:
- Failed readiness check:
- Backend process status:
- Reverse proxy status:
- Last successful commit:
- Last migration:
- Last backup manifest:

## Timeline
- HH:mm:
- HH:mm:

## Actions
- Immediate mitigation:
- Recovery action:
- Verification:

## Root Cause
- Confirmed cause:
- Contributing factors:

## Follow-up
- Prevent recurrence:
- Documentation update:
- Test or rehearsal update:
```

P3는 위 양식을 축약해도 되지만, 발생 시각, 증상, 확인한 로그, 조치, 후속 작업은 남긴다.

---

## 7. 장애 종료 기준

장애는 다음 조건을 모두 만족할 때 resolved로 바꾼다.

- 공개 홈페이지 route가 열린다.
- `/api/health`가 통과한다.
- `/api/ready`가 통과한다.
- 상담 문의 테스트가 실제 개인정보가 아닌 테스트 데이터로 접수된다.
- 내부 화면에서 테스트 문의 또는 상태를 확인할 수 있다.
- 필요한 경우 DB backup 또는 restore 결과를 확인했다.
- 재발 방지 follow-up이 최소 1개 이상 기록됐다.

장애가 DB 또는 개인정보 가능성과 관련되면 resolved 전에 백업 파일, 로그, 내부 화면 데이터를 임의로 삭제하지 않는다.

---

## 8. 보관 위치

권장 incident record 위치:

```text
docs/incidents/YYYY-MM-DD_homepage_short-title.md
```

복제용 템플릿은 `docs/incidents/INCIDENT_TEMPLATE.md`에 둔다.

운영 secret, 실제 개인정보, 전체 로그 원문은 incident record에 붙이지 않는다. 필요한 경우 로그 파일명, 시간대, 해시, 요약만 남긴다.

---

## 9. 아직 구현이 아닌 항목

이 런북은 기준 문서다. 다음은 아직 자동화하지 않았다.

- process manager별 log rotation 설정 파일 생성
- Windows Task Scheduler log cleanup 등록
- Linux logrotate 설정 파일 생성
- 외부 로그 수집기 연동
- 장애 알림 발송
- incident record 자동 생성
