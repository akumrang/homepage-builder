# 내부 식별자 rename 범위 판단

Status: Decided
Project: homepage
Last Updated: 2026-06-30

---

## 1. 목적

이 문서는 외부 브랜드명을 `베틀 시스템`으로 교정한 뒤, 저장소와 운영 스크립트에 남아 있는 내부 식별자 `muksan`, `MUKSAN`, `Muksan`을 어디까지 바꿀지 판단하기 위한 기준 문서다.

이번 문서의 목표는 구현이 아니다. 내부 식별자 변경은 package 이름, import 경로, Windows service id, 배포 directory, DB enum, localStorage key, 운영 런북까지 영향을 줄 수 있으므로 먼저 범위를 분류한다.

---

## 2. 현재 결론

판정: `KEEP`

묵산 판정일: 2026-06-30

내부 식별자는 지금처럼 유지하고, 고객 노출 문구만 `베틀 시스템`으로 관리한다.

이유:

- 고객에게 보이는 문구는 이미 `베틀 시스템`으로 교정했다.
- 남아 있는 `muksan` 계열 값은 대부분 코드, package, runtime path, service id, enum 같은 내부 식별자다.
- 내부 식별자를 한 번에 바꾸면 동작 영향은 작지 않지만, 고객 가치 증가는 제한적이다.
- 특히 Windows service id와 운영 path는 실제 운영 설치 이후 바꾸면 재설치나 데이터 이동이 필요하다.
- DB enum 값은 기존 데이터와 migration 영향을 고려해야 한다.

따라서 내부 식별자 rename은 지금 실행하지 않는다. 이 사안은 “브랜드 문구 교정”이 아니라 별도 기술 작업이며, 실제 운영 설치 전 필요성이 생길 때 다시 판단한다.

---

## 3. 분류 기준

| 분류 | 예시 | 처리 |
|---|---|---|
| 고객 노출 문구 | 화면 제목, 고객 발송 문안, 샘플 설명, 상담 자료 | 반드시 `베틀 시스템` 사용 |
| 내부 설명 문구 | 개발 문서의 판단자 호칭, 묵산 승인 기록 | 맥락상 허용 |
| 운영 표시 문구 | 콘솔 로그, service display name, script 출력 | 낮은 위험으로 교정 가능 |
| package/import 식별자 | `muksan-homepage`, `@muksan-homepage/shared` | 별도 일괄 rename 필요 |
| runtime/service 식별자 | `C:/muksan-homepage`, `muksan-homepage-backend` | 운영 설치 전 승인 필요 |
| 저장 데이터 enum | `MUKSAN_CREATED`, `MUKSAN_APPROVED_REPLACEMENT` | migration 계획 전에는 유지 |
| client 저장 key | `muksan-homepage-internal-access-token` | alias 또는 token 초기화 안내 필요 |
| 개발 기본값 | `muksan-local-dev` | 운영 불가 값이므로 낮은 위험, 단 문서와 테스트 동시 수정 필요 |

---

## 4. 남아 있는 주요 내부 식별자

현재 저장소에는 다음 계열이 남아 있다.

| 식별자 | 위치 | 영향 |
|---|---|---|
| `muksan-homepage` | root package, lockfile, backup manifest, service name, docs, scripts | package명과 운영 service/path를 함께 건드림 |
| `@muksan-homepage/shared` | frontend/backend import와 package dependency | import, package-lock 동시 갱신 필요 |
| `MUKSAN_CREATED` | frontend/backend type, content validation, intake mapping, docs | DB/source enum 의미와 연결됨 |
| `MUKSAN_APPROVED_REPLACEMENT` | frontend/backend type, content validation, intake mapping, docs | DB/source enum 의미와 연결됨 |
| `muksan-local-dev` | internal access default, smoke test, README, access-control docs | 로컬 개발 키와 테스트 기대값 수정 필요 |
| `C:/muksan-homepage/*` | Windows 배포 문서와 deploy scripts | 실제 운영 설치 전이면 변경 가능, 설치 후면 migration 필요 |
| `Invoke-MuksanHomepage*.ps1` | deploy/windows script filename | 파일명, README, docs 참조 동시 변경 필요 |
| `Test-MuksanHomepageRuntime.ps1` | deploy/windows script filename | 파일명, README, docs 참조 동시 변경 필요 |

---

## 5. 지금 바꾸지 않는 이유

현재 작업 흐름의 중심은 첫 파일럿과 MVP 운영 준비다.

이 단계에서 중요한 것은 고객이 보는 이름이 잘못 노출되지 않는 것이다. 그 문제는 `README.md`, 프로젝트 헌법, 고객 발송 문서, 샘플 문안, frontend 화면 라벨에서 이미 처리했다.

반면 내부 식별자 rename은 다음 위험이 있다.

- package 이름 변경 후 import 누락
- `package-lock.json` 대량 변경
- Windows 런북과 deploy script 참조 누락
- 이미 생성된 backup manifest, restore log와 새 service명이 섞임
- 내부 접근 token key 변경으로 기존 browser 저장값 무효화
- DB enum 변경 시 기존 자료와 smoke test 불일치

따라서 내부 식별자 rename은 기능 개선이 아니라 release hygiene 작업으로 분리한다.

---

## 6. 권장 처리 순서

### 6.1 즉시 유지

다음은 당분간 유지한다.

- `MUKSAN_CREATED`
- `MUKSAN_APPROVED_REPLACEMENT`
- `@muksan-homepage/*`
- `muksan-homepage` package name
- `muksan-local-dev`
- 기존 backup manifest와 restore log의 `service` 값

유지 사유:

- 고객에게 직접 노출되지 않는다.
- 바꾸려면 테스트, lockfile, 데이터 호환성을 함께 점검해야 한다.
- 지금 바꾸지 않아도 첫 파일럿 판단에는 영향이 작다.

### 6.2 운영 설치 전 재판정

다음은 실제 Windows service 설치 전에 재판정한다.

- `C:/muksan-homepage/*`
- `muksan-homepage-backend`
- `muksan-homepage-backend.winsw.xml.template`
- `Invoke-MuksanHomepageService.ps1`
- `Invoke-MuksanHomepageCaddy.ps1`
- `Test-MuksanHomepageRuntime.ps1`

운영 설치 전에 `bettle-homepage` 계열로 바꾸기로 결정하면 비교적 안전하다. 운영 설치 이후에는 service uninstall/install, path migration, 로그 경로 이전까지 필요할 수 있다.

### 6.3 DB enum rename은 후순위

`MUKSAN_CREATED`, `MUKSAN_APPROVED_REPLACEMENT`는 단순 문구가 아니라 asset source 의미를 가진다.

바꾸려면 다음이 필요하다.

- frontend/backend type 동시 변경
- validation 허용값 변경
- seed와 smoke test 변경
- DB 저장값 migration 또는 구버전 값 호환
- 내부 화면 라벨 확인

현재는 화면 라벨만 `베틀 시스템 제작`, `베틀 시스템 승인 대체`로 교정한 상태가 적절하다.

---

## 7. 선택지

### 선택지 A: 내부 codename 유지

외부에는 `베틀 시스템`만 사용하고, 내부 코드명은 `muksan-homepage`로 유지한다.

장점:

- 변경 비용이 낮다.
- 기존 테스트와 런북을 흔들지 않는다.
- 고객 노출 문제는 이미 해결되어 있다.

단점:

- 공개 저장소나 운영 로그를 보는 사람이 내부 호칭을 볼 수 있다.
- 장기 브랜드 일관성은 약하다.

### 선택지 B: 운영 설치 전 일괄 rename

첫 실제 운영 설치 전에 package, service, runtime path를 `bettle-homepage` 계열로 바꾼다.

장점:

- 장기 브랜드 일관성이 좋다.
- 실제 Windows service 설치 전에 바꾸면 후속 비용이 작다.

단점:

- 변경 범위가 넓다.
- `package-lock.json`, deploy script, docs, smoke test를 모두 갱신해야 한다.
- enum과 과거 backup manifest까지 완전히 정리하려면 migration 판단이 필요하다.

### 선택지 C: 부분 rename

운영 표시 문구와 service display name만 먼저 바꾸고, package/import/enum은 유지한다.

장점:

- 외부에 가까운 운영 표시만 정리할 수 있다.
- package/import churn을 피한다.

단점:

- `bettle`과 `muksan`이 내부에 동시에 남아 혼란이 생길 수 있다.
- 나중에 다시 rename 작업이 필요할 수 있다.

---

## 8. 권고

현재 확정 판정은 선택지 A, 즉 내부 codename 유지다. 다만 실제 운영 Windows service를 설치하기 전 한 번만 선택지 B를 재판정할 수 있다.

즉:

1. 지금은 내부 식별자 rename을 실행하지 않는다.
2. 첫 파일럿 고객에게 보이는 문구와 자료만 `베틀 시스템`으로 유지한다.
3. 운영 설치 직전 `bettle-homepage` 계열로 일괄 rename할 필요가 있는지 묵산이 다시 확인한다.
4. 승인하면 package/import/path/service/docs를 한 번에 바꾸고 `npm.cmd run verify`, `npm.cmd run rehearse:local-production`까지 실행한다.
5. DB enum은 별도 migration 계획 전에는 유지한다.

---

## 9. 묵산 판정 기록

묵산은 `KEEP`을 선택했다.

이 판정의 의미:

- `muksan-homepage`, `@muksan-homepage/*`, `MUKSAN_CREATED`, `muksan-local-dev`, `C:/muksan-homepage/*` 등 내부 식별자는 당장 바꾸지 않는다.
- 고객에게 보이는 화면, 고객 발송 문안, 상담 자료, 샘플 설명에는 `베틀 시스템`을 사용한다.
- 코드나 운영 식별자에 남은 `muksan`은 고객 노출 브랜드명이 아니라 내부 codename 또는 기술 식별자로 본다.
- 운영 Windows service를 실제 설치하기 전에는 service/path 이름을 유지할지 한 번 더 확인할 수 있다.

---

## 10. 다음 작업

다음 1순위 추천 작업은 첫 파일럿 고객 발송 자료 최종 패키지 점검이다.

확인할 것:

- `docs/17_FIRST_PILOT_CUSTOMER_SEND_COPY.md`에 `베틀 시스템` 표기가 자연스럽게 들어가 있는지
- 고객이 작성해야 할 항목이 과도하지 않은지
- 발송 직전 묵산이 채울 placeholder가 명확한지
- 실제 고객 개인정보를 저장소에 남기지 않는 기준이 유지되는지
