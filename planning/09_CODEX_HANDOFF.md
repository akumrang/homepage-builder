# Codex 인계 문서 — 홈페이지 MVP 구현

Status: Draft  
Project: homepage  
Last Updated: 2026-06-24

---

## 1. 현재 상황

이 프로젝트는 묵산 SaaS의 세 번째 축인 홈페이지 제작·관리 프로젝트다.

현재 단계는 전략·기획 문서 작성이 완료된 상태이며, 아직 실제 앱 구현은 시작하지 않았다.

작업 경로:

C:\Users\akumr\Bettle\withgpt\homepage

---

## 2. 반드시 먼저 읽을 문서

Codex는 구현 전 다음 문서를 순서대로 읽어야 한다.

1. `README.md`
2. `docs/00_HOMEPAGE_PROJECT_CONSTITUTION.md`
3. `planning/01_PARENT_STUDENT_JOURNEY.md`
4. `planning/02_HOMEPAGE_MVP_STRUCTURE.md`
5. `planning/03_INTERNAL_PRODUCTION_WORKFLOW.md`
6. `planning/04_AI_USAGE_POLICY.md`
7. `planning/05_TEMPLATE_TYPES.md`
8. `planning/06_SYSTEM_BOUNDARY_AND_INTEGRATION.md`
9. `planning/07_TECH_ARCHITECTURE_DRAFT.md`
10. `planning/08_MVP_IMPLEMENTATION_SCOPE.md`

---

## 3. 최상위 원칙

이 프로젝트는 고객에게 홈페이지 제작툴을 판매하는 것이 아니다.

묵산 SaaS 구독 학원에게 학원당 1개의 고품질 홈페이지를 제작·제공하고, 이를 상담·공지·결제·학원관리·시험지 생성관리로 연결하는 외부 접점 시스템이다.

핵심 원칙:

- 싸구려 제품 금지
- 고객별 별도 코드베이스 금지
- 고객용 자유형 빌더 금지
- academy와 exam_system2 직접 DB 공유 금지
- 1인 또는 극소수 운영 가능성을 고려
- 자동화는 품질을 낮추는 수단이 아니라 품질을 반복 가능하게 하는 수단
- AI는 나중에 초안 생성 보조로 사용하며, MVP에서는 실제 API 연결하지 않음

---

## 4. 이번 구현 목표

이번 작업의 목표는 홈페이지 MVP scaffold를 만드는 것이다.

구현 목표:

> 샘플 학원 데이터를 기반으로 `trust-basic-v1` 템플릿 1종을 렌더링하고, 상담 문의를 backend로 제출할 수 있는 최소 구조를 만든다.

---

## 5. 권장 기술 스택

가능하면 다음 구조를 사용한다.

- Frontend: Vite + React + TypeScript
- Backend: Express + TypeScript
- Styling: CSS 또는 CSS Modules
- DB: 이번 MVP에서는 실제 DB 없이 메모리 저장 또는 JSON 로그로 시작
- 포트:
  - frontend: 5175
  - backend: 4200

---

## 6. 구현 범위

포함:

- frontend 앱 scaffold
- backend 앱 scaffold
- 샘플 학원 데이터
- `/h/sample-korean-academy` 공개 홈페이지 렌더링
- `trust-basic-v1` 템플릿 구현
- 상담 문의 폼
- 상담 문의 POST API
- backend에 문의 저장 또는 로그 확인
- 내부 제작 화면 최소판
  - 샘플 학원 목록
  - 문의 목록 또는 상태 확인
- README 실행 방법 업데이트

제외:

- academy 실제 연동
- exam_system2 실제 연동
- 실제 결제 연동
- OpenAI API 실제 연결
- 로그인·권한 전체 구현
- 커스텀 도메인
- 네이티브 앱
- 고객용 자유 편집기
- 다중 템플릿 전체 구현

---

## 7. 구현 품질 기준

기능은 작게 구현하되 화면은 실제 상품처럼 보여야 한다.

특히 공개 홈페이지는 다음 기준을 만족해야 한다.

- 모바일에서 깨지지 않음
- 학부모가 신뢰할 수 있는 첫인상
- 상담 신청 버튼이 명확함
- 과장 광고 느낌이 없음
- 국어학원 샘플에 어울리는 문구
- 기본 공지, 강사진, 커리큘럼, 오시는 길이 보임

---

## 8. 금지 사항

- 고객별 임의 코드 생성 금지
- AI가 만든 것처럼 보이는 과장 문구 금지
- 허위 실적, 허위 후기, 허위 경력 금지
- academy 또는 exam_system2 파일 수정 금지
- 다른 workspace 열거나 수정 금지
- 실제 개인정보 사용 금지
- 불필요한 대형 프레임워크 추가 금지

---

## 9. 구현 후 보고 형식

Codex는 작업 완료 후 다음 형식으로 보고한다.

1. 변경 파일 목록
2. 구현한 기능 요약
3. 실행 방법
4. 확인한 화면/URL
5. 상담 문의 테스트 결과
6. typecheck/build 실행 결과
7. 미구현 또는 보류 항목
8. 다음 작업 제안

---

## 10. 완료 기준

이번 구현은 다음을 만족하면 완료로 본다.

- frontend dev 서버 실행 가능
- backend dev 서버 실행 가능
- `/h/sample-korean-academy` 접속 가능
- 상담 문의 제출 가능
- backend에서 문의 확인 가능
- 내부 화면에서 샘플 홈페이지 또는 문의 상태 확인 가능
- README에 실행 방법 기록
- git status clean 또는 변경 파일 명확히 보고