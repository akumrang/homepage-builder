# 홈페이지 기술 아키텍처 초안

Status: Draft  
Project: homepage  
Last Updated: 2026-06-24

---

## 1. 목적

이 문서는 묵산 홈페이지 프로젝트의 초기 기술 구조를 정의한다.

목표는 학원당 1개의 고품질 홈페이지를 제작·제공하되, 고객별 별도 코드베이스를 만들지 않고 누적 3천~1만 개 홈페이지를 관리 가능한 구조로 만드는 것이다.

---

## 2. 핵심 방향

홈페이지 시스템은 고객별로 코드를 복사해서 만드는 방식이 아니다.

하나의 애플리케이션이 academyId 또는 homepage slug를 기준으로 각 학원의 공개 홈페이지를 렌더링한다.

기본 방향:

```text
공통 코드
+ 템플릿
+ 학원별 콘텐츠 데이터
= 학원별 홈페이지
```

## 3. 추천 기술 스택

초기 후보 기술 스택은 다음과 같다.

| 영역 | 후보 |
|---|---|
| Frontend | React + TypeScript |
| Framework | Next.js 또는 Vite 기반 React |
| Backend | Node.js + Express 또는 Next.js API |
| Database | PostgreSQL + Prisma |
| Styling | CSS Modules, Tailwind, 또는 일반 CSS |
| Hosting | Vercel, AWS, 또는 별도 VPS |
| Storage | S3 호환 객체 스토리지 |
| Image | 업로드 이미지 최적화 |
| AI | OpenAI API 등 외부 AI API |
| Monitoring | 오류 로그, uptime check, 알림 |

academy 프로젝트가 Vite React + Express + Prisma 구조이므로, 장기 통합을 고려하면 React + TypeScript + Node.js + Prisma 계열이 자연스럽다.

## 4. 멀티테넌트 구조

홈페이지는 다중 학원 구조를 전제로 한다.

기본 식별자:

- academyId
- homepageId
- slug
- customDomain
- templateKey
- templateVersion

접속 예:

- `https://muksan.kr/h/{slug}`
- `https://{academySlug}.muksan.kr`
- `https://www.customer-academy.com`

초기에는 slug 또는 서브도메인 방식으로 시작하고, 커스텀 도메인은 후순위로 둘 수 있다.

## 5. 주요 데이터 모델 초안

초기 모델 후보:

```text
Homepage
  id
  academyId
  slug
  title
  status
  templateKey
  templateVersion
  customDomain
  publishedAt
  createdAt
  updatedAt

HomepageContent
  id
  homepageId
  sectionKey
  contentJson
  sortOrder
  visible
  updatedAt

HomepageAsset
  id
  homepageId
  type
  url
  altText
  usage
  createdAt

HomepageInquiry
  id
  homepageId
  academyId
  parentName
  phone
  studentGrade
  subject
  message
  privacyConsent
  status
  createdAt

HomepageNotice
  id
  homepageId
  title
  body
  pinned
  visible
  publishedAt
  createdAt
  updatedAt
```

HomepageNotice는 초기에는 homepage가 소유할 수 있다. 장기적으로는 academy Notice와 통합한다.

## 6. 페이지 렌더링 방식

초기에는 서버 또는 앱이 요청된 homepage를 조회하여 템플릿에 데이터를 넣어 렌더링한다.

```text
요청 URL
→ slug 또는 domain 확인
→ Homepage 조회
→ templateKey 확인
→ contentJson 조회
→ 템플릿 렌더링
→ 공개 페이지 표시
```

## 7. 템플릿 관리 방식

템플릿은 코드와 버전으로 관리한다.

예:

- trust-basic-v1
- exam-focused-v1
- care-smallgroup-v1
- junior-growth-v1
- premium-brand-v1

템플릿 변경은 기존 홈페이지를 깨뜨리면 안 된다.

따라서 templateKey와 templateVersion을 저장한다.

## 8. 관리자/내부 제작 화면

고객에게 자유형 빌더를 제공하지 않는다.

초기 관리자 화면은 묵산 내부 제작자 중심이다.

필요 화면:

- 제작 요청 목록
- 학원 정보 입력
- 자료 누락 체크
- AI 초안 생성
- 템플릿 선택
- 미리보기
- 검수 체크리스트
- 고객 확인 상태
- 게시 상태
- 문의 목록

## 9. AI 생성 구조

AI 생성은 별도 서비스 또는 함수로 분리한다.

기본 흐름:

```text
학원 정보 입력
→ AI prompt 구성
→ AI 초안 생성
→ 초안 저장
→ 내부 검수
→ 최종 콘텐츠 반영
```

AI 초안과 최종 콘텐츠는 구분한다.

AI 초안을 바로 공개 페이지에 반영하지 않는다.

## 10. 게시 구조

게시 상태는 최소 다음을 구분한다.

- draft
- review
- approved
- published
- archived

초기에는 별도 정적 배포 없이 DB 기반 동적 렌더링으로 시작할 수 있다.

장기적으로 트래픽과 안정성을 위해 정적 생성 또는 캐싱을 검토한다.

## 11. 통합 구조

homepage는 academy와 exam_system2를 직접 DB로 연결하지 않는다.

연결은 API 또는 integration layer로 한다.

초기 연결 후보:

- 상담 문의 → academy 상담함
- 공지사항 → academy 공지
- 결제 링크 → academy invoice/payment
- 관리자 진입 → academy 또는 exam_system2 URL
- 샘플 자료 → exam_system2 공개 가능한 자료

## 12. 보안 원칙

홈페이지는 공개 영역이다.

따라서 다음을 지킨다.

- 관리자 기능은 인증 필요
- 상담 문의는 개인정보 동의 필요
- 결제 민감정보는 저장하지 않음
- 학생 개인정보는 공개하지 않음
- 이미지 업로드는 파일 타입과 크기 제한
- 관리자 입력 HTML은 sanitize 필요
- API rate limit 필요

## 13. 초기 구현 우선순위

초기 구현 순서 후보:

1. 프로젝트 기본 앱 생성
2. 홈페이지 모델 초안
3. 템플릿 1종 코드화
4. 샘플 학원 데이터 렌더링
5. 상담 문의 저장
6. 내부 제작 화면 최소 구현
7. AI 초안 생성 함수 연결
8. 미리보기와 게시 상태 구분
9. 템플릿 3종 확장
10. academy 연동 준비

## 14. 보류할 기술

초기에는 다음을 보류한다.

- 네이티브 앱
- 완전 자유형 페이지 빌더
- 고객별 별도 배포
- 자체 PG 처리
- 고급 마케팅 자동화
- 실시간 채팅
- 다국어
- 대규모 CDN 최적화
- 복잡한 권한 시스템

## 15. 한 줄 정의

묵산 홈페이지 기술 구조는 하나의 공통 시스템이 템플릿과 학원별 콘텐츠 데이터를 조합하여 학원별 고품질 홈페이지를 제공하는 멀티테넌트 구조다.