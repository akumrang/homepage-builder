# 고객 홈페이지 자료 수집 양식과 스키마

Status: Draft  
Project: homepage  
Last Updated: 2026-06-27

---

## 1. 목적

이 문서는 첫 고객 파일럿을 준비하기 위해 홈페이지 제작 전에 고객 학원으로부터 받아야 할 자료를 정의한다.

목표는 고객에게 홈페이지 제작툴을 제공하는 것이 아니라, 묵산 내부 제작자가 표준 템플릿 안에서 고품질 홈페이지를 만들 수 있을 만큼의 사실 정보와 선호 정보를 안정적으로 받는 것이다.

이 문서는 현재 구현된 `AcademySite` seed 구조와 연결되지만, 고객에게 `AcademySite` 전체를 직접 입력하게 하지 않는다.

---

## 2. 원칙

고객 자료 수집은 다음 원칙을 따른다.

- 고객은 자기 학원의 얼굴에 대한 정보와 선호를 제공한다.
- 묵산은 고객 자료를 바탕으로 표준 템플릿 안에서 홈페이지를 제작한다.
- 고객 입력값은 사실 정보, 공개 가능 정보, 미학적 선호로 제한한다.
- 고객에게 레이아웃 자유 편집, CSS 수정, 섹션 무제한 조립 권한을 주지 않는다.
- 고객별 별도 코드베이스를 만들지 않는다.
- 실제 학생 개인정보, 학부모 연락처 목록, 결제 정보, 시험지 원본을 받지 않는다.
- 허위 실적, 허위 후기, 확인되지 않은 강사 경력을 입력받아도 공개하지 않는다.

---

## 3. 수집 정보 구분

고객 자료는 네 종류로 나눈다.

| 구분 | 의미 | 예 |
|---|---|---|
| 고객 필수 입력 | 홈페이지 제작에 반드시 필요한 공개 정보 | 학원명, 주소, 연락처, 대상 학년, 과목 |
| 고객 선택 입력 | 품질을 높이지만 없으면 묵산이 대체안을 만들 수 있는 정보 | 대표 사진, 로고, 색상 선호, 상담 문구 톤 |
| 묵산 제작 입력 | 고객 자료를 바탕으로 묵산이 작성하거나 정리하는 정보 | 대표 문구, 강점 3개, 소개 문단, 커리큘럼 설명 |
| 내부 시스템 필드 | 고객에게 노출하지 않는 운영 필드 | `id`, `slug`, `templateId`, `productionStatus`, 내부 링크 |

---

## 4. 고객에게 받을 항목

### 4.1 기본 정보

| 항목 | 필수 | 공개 여부 | 설명 |
|---|---:|---:|---|
| 학원명 | 필수 | 공개 | 홈페이지 상단과 제목에 표시할 이름 |
| 지점명 | 선택 | 공개 가능 | 여러 지점이 있을 때 구분 |
| 대표자 또는 원장명 | 선택 | 선택 공개 | 공개 여부를 별도로 확인한다 |
| 대표 전화번호 | 필수 | 공개 | 전화 상담과 오시는 길에 사용 |
| 상담 전용 연락처 | 선택 | 공개 가능 | 대표 번호와 다를 때 사용 |
| 주소 | 필수 | 공개 | 오시는 길에 표시 |
| 운영 시간 | 필수 | 공개 | 학부모가 상담 가능 시간을 판단 |
| 교통 안내 | 권장 | 공개 | 지하철, 버스, 도보 안내 |
| 주차 안내 | 권장 | 공개 | 방문 상담 편의 정보 |

### 4.2 수업 정보

| 항목 | 필수 | 공개 여부 | 설명 |
|---|---:|---:|---|
| 대표 과목 | 필수 | 공개 | 예: 국어, 수학, 영어, 독서, 문법 |
| 대상 학년 | 필수 | 공개 | 예: 초5-초6, 중1-중3, 고1 |
| 학년별 커리큘럼 | 필수 | 공개 | 학년 또는 수준별 수업 목표와 방식 |
| 수업 방식 | 필수 | 공개 | 소수정예, 내신 대비, 독해 훈련 등 |
| 반 구성 | 권장 | 공개 | 정원, 수준별 반, 요일별 반 |
| 시간표 | 권장 | 공개 | 초기에는 대표 수업만 받아도 된다 |
| 교재 또는 자료 활용 방식 | 선택 | 공개 가능 | 자체 교재, 학교별 자료, 독서 기록 등 |

### 4.3 강사진 정보

| 항목 | 필수 | 공개 여부 | 설명 |
|---|---:|---:|---|
| 강사명 또는 공개명 | 필수 | 공개 | 실명 공개가 부담되면 공개명을 정한다 |
| 담당 과목 | 필수 | 공개 | 예: 중등 국어, 문법, 독서 |
| 담당 학년 | 필수 | 공개 | 예: 중1-중3 |
| 수업 특징 | 필수 | 공개 | 확인 가능한 수업 방식 중심 |
| 경력 | 선택 | 검수 후 공개 | 증빙 가능하거나 고객이 책임 확인한 정보만 사용 |
| 사진 | 선택 | 동의 후 공개 | 초상권과 사용 동의를 확인한다 |

### 4.4 상담 정보

| 항목 | 필수 | 공개 여부 | 설명 |
|---|---:|---:|---|
| 상담 가능 시간 | 필수 | 공개 | 예: 평일 15:00-20:00 |
| 상담 방식 | 필수 | 공개 | 전화, 방문, 온라인 문의 |
| 상담 유도 문구 톤 | 선택 | 공개 | 차분한 안내형, 입시 집중형 등 |
| 문의 후 연락 기준 | 권장 | 공개 가능 | 예: 접수 후 순차 연락 |

### 4.5 디자인 선호

| 항목 | 필수 | 공개 여부 | 설명 |
|---|---:|---:|---|
| 홈페이지 분위기 | 필수 | 내부 반영 | 신뢰형, 입시형, 소수정예형, 프리미엄형 등 |
| 대표 색상 선호 | 선택 | 내부 반영 | 템플릿 토큰 안에서만 반영 |
| 로고 파일 | 선택 | 공개 가능 | 없으면 텍스트 로고로 시작 가능 |
| 대표 사진 | 선택 | 공개 가능 | 교실, 입구, 상담 공간 등 |
| 강조하고 싶은 장점 | 필수 | 공개 | 3개 정도로 제한 |
| 참고하고 싶은 샘플 | 선택 | 내부 참고 | 그대로 복제하지 않는다 |

### 4.6 공지와 초기 운영 정보

| 항목 | 필수 | 공개 여부 | 설명 |
|---|---:|---:|---|
| 초기 공지 1-2개 | 권장 | 공개 | 상담 접수, 반 안내, 설명회 등 |
| 중요 공지 여부 | 선택 | 공개 | 상단 강조 여부 |
| 공개 여부 | 필수 | 공개/비공개 | 내부 보관 공지와 공개 공지를 구분 |

### 4.7 확인과 동의

| 항목 | 필수 | 설명 |
|---|---:|---|
| 공개 가능 정보 확인 | 필수 | 고객이 공개 가능한 정보임을 확인 |
| 사진 사용 동의 | 사진이 있으면 필수 | 로고, 교실, 강사 사진 사용 동의 |
| 강사 경력 사실 확인 | 경력이 있으면 필수 | 허위 경력 방지 |
| 개인정보 미포함 확인 | 필수 | 학생 이름, 학부모 연락처 목록 등을 제출하지 않도록 확인 |
| 게시 전 최종 확인 절차 동의 | 필수 | 고객 확인 후 게시한다는 절차 확인 |

---

## 5. 고객 입력 스키마 초안

아래 스키마는 구현 전 기준의 논리 스키마다. 당장 API나 DB 모델로 확정하지 않는다.

```ts
interface CustomerHomepageIntake {
  intakeId: string;
  academyId?: string;
  request: {
    requestedBy: string;
    requestedAt: string;
    desiredLaunchDate?: string;
    productionMemo?: string;
  };
  identity: {
    academyName: string;
    branchName?: string;
    directorName?: string;
    directorNamePublic: boolean;
  };
  location: {
    address: string;
    phone: string;
    consultationPhone?: string;
    hours: string;
    transit?: string;
    parking?: string;
  };
  education: {
    subjects: string[];
    targetGrades: string[];
    curriculum: Array<{
      title: string;
      grades: string;
      goal: string;
      method: string;
    }>;
    schedules?: Array<{
      day: string;
      time: string;
      grade: string;
      subject: string;
      className: string;
    }>;
  };
  teachers: Array<{
    name: string;
    publicName?: string;
    role: string;
    grades: string;
    focus: string;
    career?: string;
    careerVerified: boolean;
    photoAssetId?: string;
  }>;
  positioning: {
    preferredMood: "trust" | "exam" | "small-group" | "premium" | "undecided";
    preferredColors?: string[];
    taglineDraft?: string;
    emphasizedStrengths: string[];
    consultationTone?: "calm" | "direct" | "premium" | "exam-focused";
  };
  assets: {
    logoAssetId?: string;
    logoSource?: "CUSTOMER_PROVIDED" | "MUKSAN_CREATED" | "MUKSAN_APPROVED_REPLACEMENT";
    logoUsageConfirmed: boolean;
    logoTextFallbackApproved: boolean;
    heroPhotoAssetId?: string;
    heroPhotoSource?: "CUSTOMER_PROVIDED" | "MUKSAN_CREATED" | "MUKSAN_APPROVED_REPLACEMENT";
    heroPhotoUsageConfirmed: boolean;
    classroomPhotoAssetIds?: string[];
  };
  initialNotices?: Array<{
    title: string;
    date: string;
    body: string;
    pinned: boolean;
    visible: boolean;
  }>;
  confirmations: {
    publicInformationConfirmed: boolean;
    noStudentPersonalDataIncluded: boolean;
    teacherCareerFactChecked: boolean;
    customerReviewBeforePublishAccepted: boolean;
  };
}
```

---

## 6. 현재 `AcademySite`와의 매핑

현재 구현된 렌더링 데이터는 `backend/src/types.ts`의 `AcademySite`다. 고객 입력 양식은 다음 방식으로 `AcademySite` 초안으로 변환된다.

| `AcademySite` 필드 | 원천 | 매핑 방식 |
|---|---|---|
| `id` | 내부 시스템 | 묵산 시스템이 생성 |
| `academyId` | academy 또는 내부 시스템 | 실제 연동 전에는 내부 식별자 사용 |
| `slug` | 내부 시스템 | 학원명 기반으로 생성하되 충돌 방지 |
| `templateId` | 묵산 판단 | 고객 분위기 선호와 과목을 보고 선택 |
| `productionStatus` | 내부 제작 상태 | 고객이 직접 입력하지 않음 |
| `publication.assets.logo` | `assets.logoAssetId`, `assets.logoUsageConfirmed`, `assets.logoTextFallbackApproved` | 로고 파일이 있으면 출처와 사용 승인 상태를 반영하고, 없으면 승인된 텍스트 로고 fallback 여부를 반영 |
| `publication.assets.hero` | `assets.heroPhotoAssetId`, `assets.heroPhotoUsageConfirmed` | 대표 사진 asset의 출처와 사용 승인 상태를 반영하고, 없으면 묵산 승인 대체 이미지 준비 전 상태로 남김 |
| `name` | `identity.academyName` | 공개 학원명으로 사용 |
| `tagline` | `positioning.taglineDraft` 또는 묵산 작성 | 고객 초안이 없으면 묵산이 작성 |
| `summary` | 고객 수업 정보 + 묵산 작성 | 첫 화면 요약 문구로 정리 |
| `heroImage` | `assets.heroPhotoAssetId` 또는 기본 이미지 | 사진이 없으면 템플릿 기본 이미지 사용 |
| `subjects` | `education.subjects` | 그대로 사용하되 표현 통일 |
| `targetGrades` | `education.targetGrades` | 그대로 사용하되 범위 표기 정리 |
| `strengths` | `positioning.emphasizedStrengths` + 묵산 작성 | 3개 기준으로 정리 |
| `introduction` | 고객 자료 + 묵산 작성 | 철학, 운영, 관리 문단으로 재구성 |
| `teachers` | `teachers` | 경력은 검수 후 `note`에 제한 반영 |
| `curriculum` | `education.curriculum` | 학년별 트랙으로 정리 |
| `schedules` | `education.schedules` | 없으면 대표 수업 안내로 보완 필요 |
| `notices` | `initialNotices` | 초기 공개 공지로 seed |
| `location` | `location` | 주소, 전화, 운영 시간, 교통, 주차 매핑 |
| `consultation` | 상담 정보 + `positioning.consultationTone` | 상담 설명과 가능 시간 구성 |
| `links` | 내부 시스템 | 실제 연동 전에는 placeholder 또는 내부 진입값 사용 |

---

## 7. 제작 준비 완료 기준

`MATERIALS_READY`로 넘기기 위한 최소 자료 기준은 다음이다.

필수:

- 학원명
- 대표 과목 1개 이상
- 대상 학년 1개 이상
- 공개 연락처
- 주소
- 운영 시간 또는 상담 가능 시간
- 상담 방식
- 강사진 1명 이상 또는 공개 가능한 담당자 소개 1개 이상
- 커리큘럼 1개 이상
- 강조하고 싶은 장점 3개 후보
- 공개 가능 정보 확인
- 개인정보 미포함 확인

권장:

- 대표 사진 또는 교실 사진
- 로고
- 수업 시간표 1개 이상
- 초기 공지 1개 이상
- 교통 안내
- 주차 안내
- 상담 유도 문구 톤

자료가 부족하면 `WAITING_FOR_MATERIALS`로 남긴다.

---

## 8. 기존 콘텐츠 점검과 연결

현재 내부 `콘텐츠` 탭과 `content:validate`는 다음 항목을 점검한다.

- 학원명
- 대표 문구
- 대상 학년
- 대표 과목
- 연락처
- 주소
- 강사진
- 커리큘럼
- 수업 안내
- 공개 공지

고객 자료 수집 양식은 이 점검 항목을 역방향으로 채우기 위한 상위 입력 양식이다.

`assets` 입력은 backend의 `mapIntakeAssetsToPublicationAssets` 초안 helper를 통해 `publication.assets` metadata로 변환한다. 이 metadata는 고객 게시 모드에서 승인된 hero, 승인된 logo asset 또는 승인된 텍스트 로고 fallback이 있는지 판단하는 기준이 된다.

다음 구현 단계에서는 고객 입력값 또는 내부 입력 초안이 위 점검 항목을 얼마나 충족하는지 `제작 준비도`로 표시할 수 있다.

현재 내부 화면의 콘텐츠 탭은 `publication.assets` 기준 logo, hero, 게시 게이트 준비도를 읽기 전용으로 표시한다.

---

## 9. 고객에게 받지 않을 것

초기 자료 수집 양식에서 받지 않는다.

- 학생 이름, 학교, 성적, 학부모 연락처 목록
- 결제 카드 정보, 계좌 비밀번호, PG 인증 정보
- 시험지 원본, 해설 원본, 수업자료 원본 전체
- academy DB dump
- exam_system2 DB dump
- 확인되지 않은 합격 실적
- 허위 후기
- 경쟁 학원 사이트를 그대로 복제하라는 요청
- CSS, HTML, JavaScript 직접 수정 요청

필요한 경우에도 원본 시스템과 직접 DB 공유하지 않고, 별도 API와 검수 절차를 둔다.

---

## 10. 첫 파일럿 운영 방식

첫 고객 파일럿에서는 별도 고객 포털을 만들지 않는다.

권장 운영 방식:

1. 묵산이 고객에게 자료 수집 양식을 보낸다.
2. 고객은 공개 가능한 정보와 선호를 제출한다.
3. 묵산 내부 제작자가 자료 누락을 확인한다.
4. 부족한 항목은 고객에게 다시 요청한다.
5. 자료가 충분하면 `MATERIALS_READY`로 전환한다.
6. 묵산이 초안을 작성하고 `trust-basic-v1` 또는 적절한 템플릿에 반영한다.
7. 내부 검수 후 고객 확인을 받는다.
8. 고객 승인 후 게시한다.

이 단계에서는 구현보다 운영 양식과 자료 누락 기준이 먼저다.

자료 수집 전체 API와 내부 입력 화면은 첫 파일럿 전에는 구현하지 않는다. 판단 근거는 `docs/13_CUSTOMER_INTAKE_IMPLEMENTATION_DECISION.md`에 정리한다.
첫 파일럿에서 고객에게 보낼 자료 요청 패킷은 `docs/14_FIRST_PILOT_CUSTOMER_INTAKE_PACKET.md`에 정리한다.
실고객 발송 전 최종 검토는 `docs/16_FIRST_PILOT_INTAKE_PACKET_FINAL_REVIEW.md`에 정리한다.
고객별 발송용 사본 템플릿은 `docs/17_FIRST_PILOT_CUSTOMER_SEND_COPY.md`에 정리한다.
자료 회신 후 접수 기록 양식은 `docs/18_FIRST_PILOT_INTAKE_RECEIPT_RECORD_TEMPLATE.md`에 정리한다.
자료 접수 가상 판정 예시는 `docs/19_FIRST_PILOT_INTAKE_RECEIPT_REHEARSAL.md`에 정리한다.
내부 제작 화면 접근 제어 설계는 `docs/20_INTERNAL_DASHBOARD_ACCESS_CONTROL_PLAN.md`에 정리한다.

---

## 11. 다음 구현 후보

이 문서 이후의 구현 후보는 다음이다.

```text
2차 시각 QA
```

구현 범위는 다음으로 제한한다.

- 상담 폼 오류와 완료 상태 확인
- 내부 접근 키 입력 화면 확인
- 내부 탭 전환, 필터, 긴 스크롤 확인
- 실제 고객 개인정보나 민감 자료는 저장소에 넣지 않음
- 고객 계정, 고객 포털, 파일 업로드 UI는 계속 보류
- 고객 입력 양식 전체 API와 내부 입력 화면은 첫 파일럿 후 필요성이 확인되면 별도 범위로 진행
- 고객 계정, 고객 포털, 자유 편집기는 만들지 않음
