# 브라우저 화면 QA 보고서

Status: Draft  
Project: homepage  
Date: 2026-06-25  
Scope: `trust-basic-v1`, `/h/sample-korean-academy`, `/internal`

---

## 1. 목적

이번 QA는 코드 동작 여부가 아니라 묵산이 시각적으로 판정할 수 있는 상태인지 확인하기 위한 화면 점검이다.

중점 확인 항목:

- 공개 홈페이지가 테스트 화면처럼 보이지 않는지
- 모바일에서 가로 스크롤, 잘림, 겹침이 없는지
- 상담 신청 버튼이 첫 화면에서 명확한지
- 내부 제작 화면이 고객용 편집기가 아니라 운영자 확인 화면처럼 보이는지

---

## 2. 캡처 기준

Chrome DevTools Protocol로 viewport를 명시해 캡처했다.

| 화면 | Viewport | 파일 |
|---|---:|---|
| 공개 홈페이지 desktop | 1440 x 2600 | `docs/visual-qa/screenshots/public-desktop.png` |
| 공개 홈페이지 mobile | 390 x 3000 | `docs/visual-qa/screenshots/public-mobile.png` |
| 내부 제작 화면 desktop | 1440 x 2200 | `docs/visual-qa/screenshots/internal-desktop.png` |
| 내부 제작 화면 mobile | 390 x 2600 | `docs/visual-qa/screenshots/internal-mobile.png` |

레이아웃 측정 결과는 `docs/visual-qa/screenshots/layout-metrics.json`에 저장했다.

---

## 3. 수정한 문제

초기 모바일 캡처에서 다음 문제가 보였다.

- 공개 홈페이지 모바일 헤더의 상담 신청 버튼이 오른쪽으로 잘려 보임
- 공개 홈페이지 hero 정보 칩과 일부 제목이 좁은 폭에서 가로로 밀리는 위험이 있음
- 내부 제작 화면 모바일 탭 카운트가 오른쪽에서 잘려 보임

수정 내용:

- `html`, `body`, `.site-shell`, `.internal-page`에 가로 overflow 방지
- hero 콘텐츠, section heading, 내부 탭, 카드에 `min-width: 0` 적용
- 모바일 헤더 여백, 브랜드 폭, CTA 크기 조정
- 모바일 hero 제목/부제 크기 조정
- hero 정보 칩 줄바꿈 허용
- 내부 탭 카운트 줄바꿈과 우측 정렬 허용
- 내부 카드의 definition list를 모바일에서 1열로 변경

---

## 4. 기술 점검 결과

| 화면 | clientWidth | scrollWidth | overflow 요소 |
|---|---:|---:|---:|
| public-desktop | 1425 | 1425 | 0 |
| public-mobile | 390 | 390 | 0 |
| internal-desktop | 1440 | 1440 | 0 |
| internal-mobile | 390 | 390 | 0 |

판정:

- 네 화면 모두 가로 overflow 없음
- 모바일 헤더와 하단 고정 CTA는 viewport 안에 들어옴
- 내부 모바일 탭 카운트는 잘리지 않음
- 공개 홈페이지 CTA는 desktop/mobile 모두 첫 화면에서 확인 가능

---

## 5. 시각 판정 메모

개발 QA 관점의 판단:

- 공개 홈페이지 첫 화면은 학원 사이트로 식별 가능하고, 국어학원 톤과 CTA가 명확하다.
- hero 이미지는 어둡고 절제된 분위기라 신뢰감은 있으나, 묵산이 더 밝고 친근한 톤을 원하면 이미지/overlay 재조정이 필요하다.
- 모바일 hero는 CTA 접근성이 좋지만 첫 화면 비중이 hero에 크게 잡혀 있어, 더 빠르게 강점 섹션을 보이게 할지 묵산 판정이 필요하다.
- 내부 제작 화면은 고객용 편집기로 보이지 않고, 운영 확인 화면에 가깝다.

묵산 판정 필요 항목:

- hero 이미지가 국어학원 샘플의 기준 이미지로 적절한가
- 현재 어두운 overlay와 흰색 대형 타이포가 묵산이 원하는 고급감인지
- 모바일 첫 화면에서 CTA 중심 구성이 충분한지, 또는 정보 밀도를 더 높일지
- 내부 제작 화면의 톤을 더 조밀한 운영 도구형으로 바꿀지

---

## 6. 보류 항목

- 전체 페이지 하단까지의 모든 스크롤 지점 수동 시각 검수
- 상담 폼 입력/오류 상태의 화면 캡처
- 공지/문의 탭 전환 후 내부 화면 전체 캡처
- 실제 사용자 디바이스 Safari/Chrome 실기기 확인

---

## 7. 다음 판단

현재 상태는 기술적 모바일 레이아웃 QA를 통과했다. 다음 단계는 묵산이 캡처 이미지를 보고 공개 홈페이지의 브랜드 톤을 승인하거나, 이미지 밝기/여백/문구 밀도에 대한 방향을 정하는 것이다.
