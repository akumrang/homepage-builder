# Muksan Homepage Project

묵산 SaaS의 세 번째 축인 학원 홈페이지 제작·관리 프로젝트이다.

이 프로젝트는 고객에게 홈페이지 제작툴을 판매하는 것이 아니라, 묵산 SaaS 구독 학원에게 학원당 1개의 고품질 홈페이지를 제작·제공하고, 이를 상담·공지·결제·학원관리·시험지 생성관리와 연결하는 것을 목표로 한다.

---

## Project Role

묵산 SaaS는 세 축으로 구성된다.

| Project | Role |
|---|---|
| Project 1: exam_system2 | 시험지, 문제, 해설, PDF, 수업자료 생성과 관리 |
| Project 2: academy | 학생, 보호자, 반, 출결, 수납, 문자, 상담, 학원 운영 관리 |
| Project 3: homepage | 공개 홈페이지, 상담 유입, 공지 노출, 결제 진입, 관리자 진입 |

---

## Core Principles

- 홈페이지 제작툴을 판매하지 않는다.
- 학원당 1개의 홈페이지를 제작·제공한다.
- 누적 3천~1만 개 홈페이지 제작·관리를 감당할 수 있어야 한다.
- 1인 또는 극소수 운영이 가능하도록 자동화를 우선한다.
- 싸구려 제품은 만들지 않는다.
- AI는 초안 생성 보조로 사용하고, 최종 게시 전 검수한다.
- 고객별 별도 코드베이스를 만들지 않는다.
- academy와 exam_system2의 데이터 소유권을 침범하지 않는다.

---

## Planning Documents

| Document | Purpose |
|---|---|
| `docs/00_HOMEPAGE_PROJECT_CONSTITUTION.md` | 홈페이지 프로젝트 헌법 |
| `planning/01_PARENT_STUDENT_JOURNEY.md` | 학부모·학생 관점 고객 여정 |
| `planning/02_HOMEPAGE_MVP_STRUCTURE.md` | 홈페이지 MVP 페이지 구조 |
| `planning/03_INTERNAL_PRODUCTION_WORKFLOW.md` | 내부 제작 공정 |
| `planning/04_AI_USAGE_POLICY.md` | AI 사용 원칙 |
| `planning/05_TEMPLATE_TYPES.md` | 템플릿 유형 기획 |
| `planning/06_SYSTEM_BOUNDARY_AND_INTEGRATION.md` | 시스템 경계와 통합 원칙 |
| `planning/07_TECH_ARCHITECTURE_DRAFT.md` | 기술 아키텍처 초안 |

---

## Current Status

현재 단계는 전략 및 기획 문서 작성 단계이다.

아직 실제 앱 구현, DB schema, API, UI 구현은 시작하지 않았다.

---

## Next Steps

1. 문서 간 충돌 검토
2. MVP 구현 범위 확정
3. 기술 스택 최종 선택
4. 초기 앱 scaffold 생성
5. 샘플 학원 데이터 기반 홈페이지 1종 렌더링
6. 내부 제작 화면 최소 구현
7. AI 초안 생성 기능 연결