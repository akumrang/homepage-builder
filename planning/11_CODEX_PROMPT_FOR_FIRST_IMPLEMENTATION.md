# Codex 첫 구현 지시문

Status: Draft  
Project: homepage  
Last Updated: 2026-06-24

---

## Codex에게 줄 지시문

아래 지시문을 그대로 Codex에 붙여넣는다.

---

너는 지금부터 묵산 SaaS의 세 번째 축인 `homepage` 프로젝트를 구현한다.

작업 경로는 다음이다.

C:\Users\akumr\Bettle\withgpt\homepage

## 1. 작업 전 반드시 읽을 문서

먼저 다음 문서를 모두 읽고, 구현 범위를 요약한 뒤 작업에 들어가라.

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
11. `planning/09_CODEX_HANDOFF.md`
12. `planning/10_FIRST_IMPLEMENTATION_CHECKLIST.md`

## 2. 최상위 원칙

이 프로젝트는 고객에게 홈페이지 제작툴을 판매하는 프로젝트가 아니다.

묵산 SaaS 구독 학원에게 학원당 1개의 고품질 홈페이지를 제작·제공하고, 이를 상담·공지·결제·학원관리·시험지 생성관리로 연결하는 외부 접점 시스템이다.

반드시 지킬 것:

- 싸구려 제품 금지
- 고객별 별도 코드베이스 금지
- 고객용 자유형 빌더 금지
- academy와 exam_system2 직접 DB 공유 금지
- 다른 workspace 수정 금지
- 실제 개인정보 사용 금지
- 허위 실적, 허위 후기, 허위 강사 경력 금지
- 1인 또는 극소수 운영 가능성을 고려
- 기능은 작게, 화면은 실제 상품처럼

## 3. 이번 작업 목표

이번 작업은 홈페이지 MVP 첫 구현이다.

목표:

샘플 학원 데이터를 기반으로 `trust-basic-v1` 템플릿 1종을 렌더링하고, 상담 문의를 backend로 제출할 수 있는 최소 구조를 만든다.

## 4. 권장 기술 스택

가능하면 다음 구조로 scaffold하라.

- Frontend: Vite + React + TypeScript
- Backend: Express + TypeScript
- Styling: CSS 또는 CSS Modules
- DB: 이번 MVP에서는 실제 DB 없이 메모리 저장 또는 JSON 로그로 시작
- frontend 포트: 5175
- backend 포트: 4200

## 5. 구현 포함 범위

반드시 포함할 것:

1. `frontend` 앱
2. `backend` 앱
3. 샘플 학원 데이터
4. `/h/sample-korean-academy` 공개 홈페이지 렌더링
5. `trust-basic-v1` 템플릿 구현
6. 상담 문의 폼
7. 상담 문의 POST API
8. backend에서 문의 저장 또는 로그 확인
9. 내부 제작 화면 최소판
   - 샘플 학원 목록
   - 문의 목록 또는 상태 확인
10. README 실행 방법 업데이트

## 6. 구현 제외 범위

이번 작업에서 하지 말 것:

- academy 실제 연동
- exam_system2 실제 연동
- 실제 결제 연동
- PG 연동
- 문자 또는 알림톡 발송
- OpenAI API 실제 연결
- AI 초안 생성 실제 기능
- 고객용 홈페이지 제작툴
- 자유형 드래그앤드롭 편집기
- 커스텀 도메인 연결
- 로그인·권한 전체 구현
- 네이티브 앱
- 학생 개인정보 화면
- 실시간 채팅
- 다중 템플릿 전체 구현

## 7. UI 품질 기준

공개 홈페이지는 단순 테스트 화면처럼 보이면 안 된다.

다음 기준을 만족해야 한다.

- 모바일에서 깨지지 않음
- 학부모가 신뢰할 수 있는 첫인상
- 국어학원 샘플에 어울리는 문구
- 상담 신청 버튼이 명확함
- 과장 광고 느낌이 없음
- 메인, 소개, 강사진, 커리큘럼, 공지, 오시는 길이 보임
- 색상과 여백이 안정적임
- “싸구려 자동 생성 사이트”처럼 보이지 않음

## 8. 상담 문의 기준

상담 문의 폼 항목:

- 보호자 이름
- 연락처
- 학생 학년
- 관심 과목
- 문의 내용
- 개인정보 수집 동의

개인정보 수집 동의가 없으면 제출되지 않아야 한다.

제출 후 접수 완료 메시지가 보여야 한다.

backend에서 접수 내용을 확인할 수 있어야 한다.

## 9. 내부 제작 화면 기준

내부 제작 화면은 고객용 편집기가 아니다.

묵산 내부 제작자가 현재 샘플 홈페이지와 문의 상태를 확인하는 최소 화면이다.

가능한 경로 예:

- `/internal`
- `/admin`
- `/studio`

이름은 코드 구조에 맞게 판단하되, README에 기록하라.

## 10. 검증

구현 후 다음을 확인하라.

- frontend dev 서버 실행
- backend dev 서버 실행
- `/h/sample-korean-academy` 접속
- 상담 문의 제출
- backend에서 문의 확인
- 내부 화면에서 상태 또는 문의 확인
- typecheck 또는 build 실행 가능 여부

## 11. 보고 형식

작업 완료 후 다음 형식으로 보고하라.

1. 읽은 문서 목록
2. 구현한 기능 요약
3. 변경 파일 목록
4. 실행 방법
5. 확인한 URL
6. 상담 문의 테스트 결과
7. typecheck/build 결과
8. 보류한 항목
9. 다음 작업 제안

중요: 단순 결과 요약만 하지 말고, 핵심 코드 근거도 10~30줄 정도 포함하라.