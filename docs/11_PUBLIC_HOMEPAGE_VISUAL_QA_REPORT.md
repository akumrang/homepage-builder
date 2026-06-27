# 공개 홈페이지 시각 QA 보고서

Status: Draft
Project: homepage
Last Updated: 2026-06-27

---

## 1. 목적

`trust-basic-v1` 샘플 공개 홈페이지가 학부모가 보는 첫 화면으로 깨지지 않는지 확인한다.

검증 대상:

```text
http://127.0.0.1:5175/h/sample-korean-academy
```

판정 범위:

- 데스크톱 첫 화면
- 데스크톱 전체 페이지
- 태블릿 첫 화면
- 모바일 첫 화면
- 모바일 상담 폼
- 필수 섹션 존재
- 가로 overflow 여부
- 상담 CTA와 상담 폼 가시성

---

## 2. 검증 방법

로컬 backend와 frontend를 띄운 뒤 Chrome headless CDP로 캡처와 DOM 측정을 수행했다.

확인 명령:

```powershell
npm.cmd run verify
```

캡처 산출물은 다음 경로에 생성했다. 이 경로는 로컬 QA 산출물이며 커밋 대상이 아니다.

```text
.tmp/visual-qa/
```

주요 캡처:

| 화면 | 파일 |
|---|---|
| 데스크톱 첫 화면 | `.tmp/visual-qa/desktop-top-cdp.png` |
| 데스크톱 전체 페이지 | `.tmp/visual-qa/desktop-full-after-fix-cdp.png` |
| 데스크톱 상담 폼 | `.tmp/visual-qa/desktop-form-cdp.png` |
| 태블릿 첫 화면 | `.tmp/visual-qa/tablet-top-cdp.png` |
| 모바일 첫 화면 | `.tmp/visual-qa/mobile-real-top-after-fix-cdp.png` |
| 모바일 상담 폼 | `.tmp/visual-qa/mobile-real-form-after-fix-cdp.png` |
| 모바일 전체 페이지 | `.tmp/visual-qa/mobile-full-after-fix-cdp.png` |

---

## 3. 측정 결과

| 항목 | Viewport | 결과 |
|---|---:|---|
| 데스크톱 첫 화면 | 1440 x 1200 | 가로 overflow 0, CTA 표시, header/nav 정상 |
| 데스크톱 전체 페이지 | 1440 x 1200 | 전체 높이 6871px, 필수 섹션 모두 확인 |
| 태블릿 첫 화면 | 768 x 1200 | 가로 overflow 0, nav 숨김 처리 정상 |
| 모바일 첫 화면 | 390 x 844 | 가로 overflow 0, 하단 액션바 표시 |
| 모바일 상담 폼 | 390 x 844 | 가로 overflow 0, 하단 액션바 숨김 처리 후 폼 버튼 노출 |

필수 섹션 존재:

| 섹션 | 상태 |
|---|---|
| 소개 | 확인 |
| 강사진 | 확인 |
| 커리큘럼 | 확인 |
| 공지 | 확인 |
| 상담 문의 | 확인 |
| 오시는 길 | 확인 |

문구 기준:

- 상담 CTA: 확인
- 허위 실적/허위 후기 방지 문구: 확인
- 샘플/개인정보 미사용 고지: 확인

---

## 4. 발견 사항과 조치

### 4.1 모바일 하단 액션바가 상담 폼 버튼을 덮음

초기 모바일 390 x 844 캡처에서 fixed 하단 액션바가 `상담 문의 접수` 버튼 영역과 겹쳤다.

조치:

- 상담 섹션이 viewport에 들어오면 `.mobile-action-bar is-hidden` 상태로 전환한다.
- 숨김 상태에서는 `opacity: 0`, `pointer-events: none`, 하단 이동 transform을 적용한다.
- 첫 화면에서는 하단 액션바가 계속 표시된다.

근거:

- `frontend/src/components/TrustBasicTemplate.tsx`
- `frontend/src/styles.css`

수정 후 모바일 상담 폼 측정:

```json
{
  "viewport": "390x844",
  "className": "mobile-action-bar is-hidden",
  "opacity": "0",
  "pointerEvents": "none",
  "scrollWidth": 390,
  "clientWidth": 390
}
```

### 4.2 공개 footer의 내부 제작 화면 링크 노출

공개 홈페이지 footer에 `/internal` 링크가 노출되어 있었다. 학부모용 공개 화면에는 내부 제작 화면 진입 링크가 보이지 않는 편이 맞다.

조치:

- footer의 `내부 제작 화면` 링크를 `상담 문의` 앵커 링크로 교체했다.
- 내부 제작 화면은 README와 운영 문서 기준으로 직접 접근한다.

---

## 5. 시각 판정

MVP 샘플 공개 홈페이지 기준으로는 `GO`다.

판정 근거:

- 첫 화면에서 학원명, 국어학원 맥락, 상담 CTA가 분명하다.
- 색상과 여백은 안정적이며 테스트 화면처럼 보이지 않는다.
- 데스크톱/태블릿/모바일에서 가로 overflow가 없다.
- 소개, 강사진, 커리큘럼, 공지, 상담, 오시는 길이 모두 확인된다.
- 상담 폼은 모바일에서 버튼이 가려지지 않는다.
- 공개 화면에서 내부 제작 화면 링크가 제거됐다.

---

## 6. 보류 항목

실제 고객 게시 전에는 다음을 별도로 확인한다.

- 실제 학원 사진 적용 후 hero crop 재확인
- 실제 로고 적용 후 mobile header 길이 재확인
- 실제 공지 제목이 길어질 때 줄바꿈 확인
- 실제 주소/지도 연동 시 오시는 길 섹션 재확인
- 샘플 고지 문구를 고객 게시용 문구로 전환할 때 `docs/12_PUBLICATION_MODE_POLICY.md` 기준 적용
