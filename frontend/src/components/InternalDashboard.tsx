import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ApiRequestError,
  clearInternalAccessToken,
  createNotice,
  deleteNotice,
  fetchAcademy,
  fetchAcademies,
  fetchContentChecks,
  fetchInquiries,
  fetchNotices,
  getInternalAccessToken,
  setInternalAccessToken,
  updateAcademyProductionStatus,
  updateInquiryStatus,
  updateNotice
} from "../api";
import type { AcademySite, AcademySummary, ContentCheck, Inquiry, NoticeInput, NoticeItem, ProductionStatus } from "../types";

type InternalTab = "status" | "content" | "notices" | "inquiries";
type InquiryStatusFilter = "ALL" | Inquiry["status"];
type NoticePinFilter = "ALL" | "PINNED" | "NORMAL";
type NoticeVisibilityFilter = "ALL" | "HIDDEN" | "VISIBLE";

const statusLabels: Record<string, string> = {
  REQUESTED: "제작 요청 접수",
  WAITING_FOR_MATERIALS: "자료 요청 중",
  MATERIALS_READY: "자료 준비 완료",
  DRAFT_CREATED: "초안 제작 완료",
  INTERNAL_REVIEW: "내부 검수 중",
  CUSTOMER_REVIEW: "고객 확인 중",
  APPROVED: "승인 완료",
  PUBLISHED: "게시 완료"
};

const productionStatusOptions: ProductionStatus[] = [
  "REQUESTED",
  "WAITING_FOR_MATERIALS",
  "MATERIALS_READY",
  "DRAFT_CREATED",
  "INTERNAL_REVIEW",
  "CUSTOMER_REVIEW",
  "APPROVED",
  "PUBLISHED"
];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyNoticeForm(): NoticeInput {
  return {
    title: "",
    date: getTodayDate(),
    body: "",
    pinned: false,
    visible: true
  };
}

export default function InternalDashboard() {
  const [academies, setAcademies] = useState<AcademySummary[]>([]);
  const [activeAcademy, setActiveAcademy] = useState<AcademySite | null>(null);
  const [contentChecks, setContentChecks] = useState<ContentCheck[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [noticeForm, setNoticeForm] = useState<NoticeInput>(createEmptyNoticeForm);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InternalTab>("status");
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<InquiryStatusFilter>("ALL");
  const [inquiryGradeFilter, setInquiryGradeFilter] = useState("ALL");
  const [inquirySubjectFilter, setInquirySubjectFilter] = useState("ALL");
  const [inquirySearch, setInquirySearch] = useState("");
  const [noticeVisibilityFilter, setNoticeVisibilityFilter] = useState<NoticeVisibilityFilter>("ALL");
  const [noticePinFilter, setNoticePinFilter] = useState<NoticePinFilter>("ALL");
  const [noticeSearch, setNoticeSearch] = useState("");
  const [accessToken, setAccessTokenValue] = useState(() => getInternalAccessToken());
  const [accessTokenInput, setAccessTokenInput] = useState(accessToken);
  const [error, setError] = useState<string | null>(null);
  const [savingAcademySlug, setSavingAcademySlug] = useState<string | null>(null);
  const [savingInquiryId, setSavingInquiryId] = useState<string | null>(null);
  const [isSavingNotice, setIsSavingNotice] = useState(false);

  function resetInternalData() {
    setAcademies([]);
    setActiveAcademy(null);
    setContentChecks([]);
    setInquiries([]);
    setNotices([]);
    setEditingNoticeId(null);
    setNoticeForm(createEmptyNoticeForm());
  }

  function handleRequestError(requestError: unknown, fallbackMessage: string) {
    const message = requestError instanceof Error ? requestError.message : fallbackMessage;

    if (requestError instanceof ApiRequestError && (requestError.status === 401 || requestError.status === 503)) {
      clearInternalAccessToken();
      setAccessTokenValue("");
      setAccessTokenInput("");
      resetInternalData();
    }

    setError(message);
  }

  async function load() {
    try {
      const [academyData, inquiryData] = await Promise.all([fetchAcademies(), fetchInquiries()]);
      const firstAcademySlug = academyData[0]?.slug;
      const [noticeData, activeAcademyData, contentCheckData] = firstAcademySlug
        ? await Promise.all([fetchNotices(firstAcademySlug), fetchAcademy(firstAcademySlug), fetchContentChecks(firstAcademySlug)])
        : [[], null, []];

      setAcademies(academyData);
      setActiveAcademy(activeAcademyData);
      setContentChecks(contentCheckData);
      setInquiries(inquiryData);
      setNotices(noticeData);
      setError(null);
    } catch (requestError) {
      handleRequestError(requestError, "내부 데이터를 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    if (accessToken.trim().length > 0) {
      void load();
    }
  }, [accessToken]);

  function handleAccessSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextToken = accessTokenInput.trim();
    if (!nextToken) {
      setError("내부 접근 키를 입력해 주세요.");
      return;
    }

    setInternalAccessToken(nextToken);
    setAccessTokenValue(nextToken);
    setError(null);
  }

  function handleAccessReset() {
    clearInternalAccessToken();
    setAccessTokenValue("");
    setAccessTokenInput("");
    setError(null);
    resetInternalData();
  }

  async function handleStatusChange(inquiry: Inquiry) {
    const nextStatus = inquiry.status === "NEW" ? "CHECKED" : "NEW";
    setSavingInquiryId(inquiry.id);
    setError(null);

    try {
      const result = await updateInquiryStatus(inquiry.id, { status: nextStatus });
      setInquiries((current) => current.map((item) => (item.id === inquiry.id ? result.inquiry : item)));
    } catch (requestError) {
      handleRequestError(requestError, "상담 문의 상태를 변경하지 못했습니다.");
    } finally {
      setSavingInquiryId(null);
    }
  }

  async function handleAcademyStatusChange(academy: AcademySummary, productionStatus: ProductionStatus) {
    setSavingAcademySlug(academy.slug);
    setError(null);

    try {
      const result = await updateAcademyProductionStatus(academy.slug, { productionStatus });
      setAcademies((current) => current.map((item) => (item.slug === academy.slug ? result.academy : item)));
    } catch (requestError) {
      handleRequestError(requestError, "홈페이지 제작 상태를 변경하지 못했습니다.");
    } finally {
      setSavingAcademySlug(null);
    }
  }

  const newInquiryCount = inquiries.filter((inquiry) => inquiry.status === "NEW").length;
  const inquiryGradeOptions = useMemo(
    () => [...new Set(inquiries.map((inquiry) => inquiry.studentGrade).filter(Boolean))],
    [inquiries]
  );
  const inquirySubjectOptions = useMemo(
    () => [...new Set(inquiries.map((inquiry) => inquiry.subject).filter(Boolean))],
    [inquiries]
  );
  const filteredInquiries = useMemo(() => {
    const normalizedSearch = inquirySearch.trim().toLowerCase();

    return inquiries.filter((inquiry) => {
      const matchesStatus = inquiryStatusFilter === "ALL" || inquiry.status === inquiryStatusFilter;
      const matchesGrade = inquiryGradeFilter === "ALL" || inquiry.studentGrade === inquiryGradeFilter;
      const matchesSubject = inquirySubjectFilter === "ALL" || inquiry.subject === inquirySubjectFilter;
      const searchableText = [
        inquiry.parentName,
        inquiry.phone,
        inquiry.studentGrade,
        inquiry.subject,
        inquiry.message,
        inquiry.academySlug
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = normalizedSearch.length === 0 || searchableText.includes(normalizedSearch);

      return matchesStatus && matchesGrade && matchesSubject && matchesSearch;
    });
  }, [inquiries, inquiryGradeFilter, inquirySearch, inquiryStatusFilter, inquirySubjectFilter]);
  const hasInquiryFilters =
    inquiryStatusFilter !== "ALL" ||
    inquiryGradeFilter !== "ALL" ||
    inquirySubjectFilter !== "ALL" ||
    inquirySearch.trim().length > 0;
  const activeAcademySlug = academies[0]?.slug;
  const visibleNoticeCount = notices.filter((notice) => notice.visible).length;
  const pinnedNoticeCount = notices.filter((notice) => notice.pinned).length;
  const filteredNotices = useMemo(() => {
    const normalizedSearch = noticeSearch.trim().toLowerCase();

    return notices.filter((notice) => {
      const matchesVisibility =
        noticeVisibilityFilter === "ALL" ||
        (noticeVisibilityFilter === "VISIBLE" && notice.visible) ||
        (noticeVisibilityFilter === "HIDDEN" && !notice.visible);
      const matchesPin =
        noticePinFilter === "ALL" ||
        (noticePinFilter === "PINNED" && notice.pinned) ||
        (noticePinFilter === "NORMAL" && !notice.pinned);
      const searchableText = [
        notice.title,
        notice.date,
        notice.body,
        notice.pinned ? "중요" : "일반",
        notice.visible ? "공개" : "비공개"
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = normalizedSearch.length === 0 || searchableText.includes(normalizedSearch);

      return matchesVisibility && matchesPin && matchesSearch;
    });
  }, [noticePinFilter, noticeSearch, noticeVisibilityFilter, notices]);
  const hasNoticeFilters =
    noticeVisibilityFilter !== "ALL" || noticePinFilter !== "ALL" || noticeSearch.trim().length > 0;
  const passedContentCheckCount = contentChecks.filter((item) => item.ok).length;
  const tabItems: Array<{ id: InternalTab; label: string; count: string }> = [
    { id: "status", label: "상태", count: `${academies.length}개` },
    {
      id: "content",
      label: "콘텐츠",
      count: activeAcademy ? `${passedContentCheckCount}/${contentChecks.length} 확인` : "대기"
    },
    { id: "notices", label: "공지", count: `${visibleNoticeCount}건 공개` },
    { id: "inquiries", label: "문의", count: `${newInquiryCount}건 미확인` }
  ];

  async function reloadNotices(academySlug: string) {
    setNotices(await fetchNotices(academySlug));
  }

  async function handleNoticeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeAcademySlug) {
      setError("공지사항을 등록할 학원 정보가 없습니다.");
      return;
    }

    setIsSavingNotice(true);
    setError(null);

    try {
      if (editingNoticeId) {
        await updateNotice(editingNoticeId, noticeForm);
      } else {
        await createNotice(activeAcademySlug, noticeForm);
      }

      await reloadNotices(activeAcademySlug);
      setNoticeForm(createEmptyNoticeForm());
      setEditingNoticeId(null);
    } catch (requestError) {
      handleRequestError(requestError, "공지사항을 저장하지 못했습니다.");
    } finally {
      setIsSavingNotice(false);
    }
  }

  function handleNoticeEdit(notice: NoticeItem) {
    setEditingNoticeId(notice.id);
    setNoticeForm({
      title: notice.title,
      date: notice.date,
      body: notice.body,
      pinned: notice.pinned,
      visible: notice.visible
    });
  }

  async function handleNoticeDelete(notice: NoticeItem) {
    if (!activeAcademySlug) return;

    const shouldDelete = window.confirm(`"${notice.title}" 공지를 삭제할까요?`);
    if (!shouldDelete) return;

    setIsSavingNotice(true);
    setError(null);

    try {
      await deleteNotice(notice.id);
      await reloadNotices(activeAcademySlug);

      if (editingNoticeId === notice.id) {
        setEditingNoticeId(null);
        setNoticeForm(createEmptyNoticeForm());
      }
    } catch (requestError) {
      handleRequestError(requestError, "공지사항을 삭제하지 못했습니다.");
    } finally {
      setIsSavingNotice(false);
    }
  }

  if (!accessToken.trim()) {
    return (
      <main className="internal-page">
        <header className="internal-header">
          <div>
            <p className="eyebrow">Muksan Internal</p>
            <h1>내부 접근 확인</h1>
            <p>묵산 내부 제작 화면은 상담 문의와 제작 상태를 다루므로 접근 키가 필요합니다.</p>
          </div>
          <div className="internal-actions">
            <a className="button button-secondary" href="/h/sample-korean-academy">
              샘플 홈페이지
            </a>
          </div>
        </header>

        <section className="internal-access-card" aria-labelledby="internal-access-title">
          <p className="eyebrow">Internal Access</p>
          <h2 id="internal-access-title">내부 접근 키 입력</h2>
          <p>
            이 장치는 운영용 로그인 시스템이 아니라 MVP 단계의 내부 접근 경계입니다. 공개 홈페이지와 상담 문의
            제출은 계속 외부에 열려 있습니다.
          </p>
          <form className="internal-access-form" onSubmit={handleAccessSubmit}>
            <label htmlFor="internal-access-token">접근 키</label>
            <input
              id="internal-access-token"
              type="password"
              value={accessTokenInput}
              onChange={(event) => setAccessTokenInput(event.target.value)}
              autoComplete="off"
              placeholder="README에 기록된 로컬 내부 접근 키"
            />
            <button className="button button-primary" type="submit">
              내부 화면 열기
            </button>
          </form>
          {error ? <p className="form-message error">{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="internal-page">
      <header className="internal-header">
        <div>
          <p className="eyebrow">Muksan Internal</p>
          <h1>홈페이지 내부 제작 화면</h1>
          <p>묵산 내부 제작자가 샘플 홈페이지와 상담 접수 상태를 확인하는 최소 화면입니다.</p>
        </div>
        <div className="internal-actions">
          <a className="button button-secondary" href="/h/sample-korean-academy">
            샘플 홈페이지
          </a>
          <button className="button button-secondary" type="button" onClick={handleAccessReset}>
            접근 키 초기화
          </button>
          <button className="button button-primary" type="button" onClick={() => void load()}>
            새로고침
          </button>
        </div>
      </header>

      {error ? <p className="form-message error">{error}</p> : null}

      <div className="internal-tabs" role="tablist" aria-label="내부 제작 화면">
        {tabItems.map((tab) => (
          <button
            className={activeTab === tab.id ? "internal-tab is-active" : "internal-tab"}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`internal-panel-${tab.id}`}
            id={`internal-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            key={tab.id}
          >
            <span>{tab.label}</span>
            <strong>{tab.count}</strong>
          </button>
        ))}
      </div>

      {activeTab === "status" ? (
      <section
        className="internal-section"
        id="internal-panel-status"
        role="tabpanel"
        aria-labelledby="internal-tab-status"
      >
        <div className="section-heading">
          <p className="eyebrow">Academies</p>
          <h2>샘플 학원 목록</h2>
        </div>
        <div className="admin-list">
          {academies.map((academy) => (
            <article className="admin-card" key={academy.id}>
              <div>
                <h3>{academy.name}</h3>
                <p>{academy.slug}</p>
              </div>
              <dl>
                <div>
                  <dt>템플릿</dt>
                  <dd>{academy.templateId}</dd>
                </div>
                <div>
                  <dt>상태</dt>
                  <dd>
                    <select
                      className="status-select"
                      value={academy.productionStatus}
                      onChange={(event) =>
                        void handleAcademyStatusChange(academy, event.target.value as ProductionStatus)
                      }
                      disabled={savingAcademySlug === academy.slug}
                      aria-label={`${academy.name} 제작 상태`}
                    >
                      {productionStatusOptions.map((status) => (
                        <option value={status} key={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                    {savingAcademySlug === academy.slug ? <span className="saving-note">저장 중</span> : null}
                  </dd>
                </div>
              </dl>
              <a className="text-link" href={`/h/${academy.slug}`}>
                공개 페이지 보기
              </a>
            </article>
          ))}
        </div>
      </section>
      ) : null}

      {activeTab === "content" ? (
      <section
        className="internal-section"
        id="internal-panel-content"
        role="tabpanel"
        aria-labelledby="internal-tab-content"
      >
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Content Review</p>
            <h2>콘텐츠 점검</h2>
          </div>
          <strong>
            {activeAcademy ? `${passedContentCheckCount}/${contentChecks.length} 확인` : "대기"}
          </strong>
        </div>
        {!activeAcademy ? (
          <div className="empty-state">점검할 샘플 학원 콘텐츠가 없습니다.</div>
        ) : (
          <div className="content-review-layout">
            <section className="content-review-summary">
              <p className="eyebrow">Seed Content</p>
              <h3>{activeAcademy.name}</h3>
              <p>{activeAcademy.summary}</p>
              <dl>
                <div>
                  <dt>slug</dt>
                  <dd>{activeAcademy.slug}</dd>
                </div>
                <div>
                  <dt>template</dt>
                  <dd>{activeAcademy.templateId}</dd>
                </div>
                <div>
                  <dt>운영 시간</dt>
                  <dd>{activeAcademy.location.hours}</dd>
                </div>
                <div>
                  <dt>교통</dt>
                  <dd>{activeAcademy.location.transit}</dd>
                </div>
              </dl>
            </section>
            <div className="content-check-grid">
              {contentChecks.map((item) => (
                <article className={item.ok ? "content-check-card is-ok" : "content-check-card is-missing"} key={item.key}>
                  <span>{item.ok ? "확인" : "누락"}</span>
                  <h3>{item.label}</h3>
                  <p>{item.value || "입력 필요"}</p>
                  <small>{item.message}</small>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
      ) : null}

      {activeTab === "notices" ? (
      <section
        className="internal-section"
        id="internal-panel-notices"
        role="tabpanel"
        aria-labelledby="internal-tab-notices"
      >
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Notices</p>
            <h2>공지사항 관리</h2>
          </div>
          <strong>
            {filteredNotices.length}/{notices.length}건
          </strong>
        </div>
        <div className="notice-admin-layout">
          <form className="notice-form" onSubmit={handleNoticeSubmit}>
            <label>
              <span>공지 제목</span>
              <input
                value={noticeForm.title}
                onChange={(event) => setNoticeForm((current) => ({ ...current, title: event.target.value }))}
                required
                placeholder="예: 7월 내신 대비반 상담 접수"
              />
            </label>
            <label>
              <span>공지 날짜</span>
              <input
                type="date"
                value={noticeForm.date}
                onChange={(event) => setNoticeForm((current) => ({ ...current, date: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>공지 내용</span>
              <textarea
                value={noticeForm.body}
                onChange={(event) => setNoticeForm((current) => ({ ...current, body: event.target.value }))}
                required
                rows={5}
                placeholder="학부모에게 공개할 공지 내용을 입력합니다."
              />
            </label>
            <div className="notice-checks">
              <label>
                <input
                  type="checkbox"
                  checked={noticeForm.pinned}
                  onChange={(event) => setNoticeForm((current) => ({ ...current, pinned: event.target.checked }))}
                />
                <span>중요 공지</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={noticeForm.visible}
                  onChange={(event) => setNoticeForm((current) => ({ ...current, visible: event.target.checked }))}
                />
                <span>공개</span>
              </label>
            </div>
            <div className="notice-form-actions">
              <button className="button button-primary" type="submit" disabled={isSavingNotice}>
                {isSavingNotice ? "저장 중" : editingNoticeId ? "공지 수정" : "공지 등록"}
              </button>
              {editingNoticeId ? (
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => {
                    setEditingNoticeId(null);
                    setNoticeForm(createEmptyNoticeForm());
                  }}
                >
                  취소
                </button>
              ) : null}
            </div>
          </form>

          {notices.length === 0 ? (
            <div className="empty-state">등록된 공지사항이 없습니다.</div>
          ) : (
            <div className="notice-list-workspace">
              <div className="notice-filter-panel">
                <div className="filter-field search-field">
                  <label htmlFor="notice-search">검색어</label>
                  <input
                    id="notice-search"
                    value={noticeSearch}
                    onChange={(event) => setNoticeSearch(event.target.value)}
                    placeholder="제목, 날짜, 내용"
                  />
                </div>
                <div className="filter-field">
                  <label htmlFor="notice-visibility-filter">공개 상태</label>
                  <select
                    id="notice-visibility-filter"
                    value={noticeVisibilityFilter}
                    onChange={(event) => setNoticeVisibilityFilter(event.target.value as NoticeVisibilityFilter)}
                  >
                    <option value="ALL">전체</option>
                    <option value="VISIBLE">공개 {visibleNoticeCount}건</option>
                    <option value="HIDDEN">비공개 {notices.length - visibleNoticeCount}건</option>
                  </select>
                </div>
                <div className="filter-field">
                  <label htmlFor="notice-pin-filter">중요 여부</label>
                  <select
                    id="notice-pin-filter"
                    value={noticePinFilter}
                    onChange={(event) => setNoticePinFilter(event.target.value as NoticePinFilter)}
                  >
                    <option value="ALL">전체</option>
                    <option value="PINNED">중요 {pinnedNoticeCount}건</option>
                    <option value="NORMAL">일반 {notices.length - pinnedNoticeCount}건</option>
                  </select>
                </div>
                <button
                  className="small-button"
                  type="button"
                  onClick={() => {
                    setNoticeSearch("");
                    setNoticeVisibilityFilter("ALL");
                    setNoticePinFilter("ALL");
                  }}
                  disabled={!hasNoticeFilters}
                >
                  초기화
                </button>
              </div>

              {filteredNotices.length === 0 ? (
                <div className="empty-state">조건에 맞는 공지사항이 없습니다.</div>
              ) : (
                <div className="notice-admin-list">
                  {filteredNotices.map((notice) => (
                    <article className="notice-admin-card" key={notice.id}>
                      <div>
                        <p className="inquiry-meta">{notice.date}</p>
                        <h3>{notice.title}</h3>
                        <p>{notice.body}</p>
                        <div className="notice-flags">
                          {notice.pinned ? <span>중요</span> : null}
                          <span>{notice.visible ? "공개" : "비공개"}</span>
                        </div>
                      </div>
                      <div className="notice-card-actions">
                        <button className="small-button" type="button" onClick={() => handleNoticeEdit(notice)}>
                          수정
                        </button>
                        <button
                          className="small-button danger"
                          type="button"
                          onClick={() => void handleNoticeDelete(notice)}
                          disabled={isSavingNotice}
                        >
                          삭제
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      ) : null}

      {activeTab === "inquiries" ? (
      <section
        className="internal-section"
        id="internal-panel-inquiries"
        role="tabpanel"
        aria-labelledby="internal-tab-inquiries"
      >
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Inquiries</p>
            <h2>상담 문의</h2>
          </div>
          <strong>
            {filteredInquiries.length}/{inquiries.length}건
          </strong>
        </div>
        {inquiries.length === 0 ? (
          <div className="empty-state">아직 접수된 상담 문의가 없습니다.</div>
        ) : (
          <div className="inquiry-workspace">
            <div className="inquiry-filter-panel">
              <div className="filter-field search-field">
                <label htmlFor="inquiry-search">검색어</label>
                <input
                  id="inquiry-search"
                  value={inquirySearch}
                  onChange={(event) => setInquirySearch(event.target.value)}
                  placeholder="이름, 연락처, 문의 내용"
                />
              </div>
              <div className="filter-field">
                <label htmlFor="inquiry-status-filter">상태</label>
                <select
                  id="inquiry-status-filter"
                  value={inquiryStatusFilter}
                  onChange={(event) => setInquiryStatusFilter(event.target.value as InquiryStatusFilter)}
                >
                  <option value="ALL">전체</option>
                  <option value="NEW">미확인</option>
                  <option value="CHECKED">확인 완료</option>
                </select>
              </div>
              <div className="filter-field">
                <label htmlFor="inquiry-grade-filter">학년</label>
                <select
                  id="inquiry-grade-filter"
                  value={inquiryGradeFilter}
                  onChange={(event) => setInquiryGradeFilter(event.target.value)}
                >
                  <option value="ALL">전체</option>
                  {inquiryGradeOptions.map((grade) => (
                    <option value={grade} key={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-field">
                <label htmlFor="inquiry-subject-filter">과목</label>
                <select
                  id="inquiry-subject-filter"
                  value={inquirySubjectFilter}
                  onChange={(event) => setInquirySubjectFilter(event.target.value)}
                >
                  <option value="ALL">전체</option>
                  {inquirySubjectOptions.map((subject) => (
                    <option value={subject} key={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="small-button"
                type="button"
                onClick={() => {
                  setInquirySearch("");
                  setInquiryStatusFilter("ALL");
                  setInquiryGradeFilter("ALL");
                  setInquirySubjectFilter("ALL");
                }}
                disabled={!hasInquiryFilters}
              >
                초기화
              </button>
            </div>

            {filteredInquiries.length === 0 ? (
              <div className="empty-state">조건에 맞는 상담 문의가 없습니다.</div>
            ) : (
              <div className="inquiry-list">
                {filteredInquiries.map((inquiry) => (
                  <article
                    className={`inquiry-card ${inquiry.status === "NEW" ? "is-new" : "is-checked"}`}
                    key={inquiry.id}
                  >
                    <div>
                      <p className="inquiry-meta">
                        {new Date(inquiry.createdAt).toLocaleString("ko-KR")} · {inquiry.academySlug}
                      </p>
                      <h3>
                        {inquiry.parentName} 보호자 · {inquiry.studentGrade} · {inquiry.subject}
                      </h3>
                      <p>{inquiry.message}</p>
                    </div>
                    <div className="inquiry-side">
                      <span className={`status-badge ${inquiry.status === "NEW" ? "new" : "checked"}`}>
                        {inquiry.status === "NEW" ? "미확인" : "확인 완료"}
                      </span>
                      <a className="text-link" href={`tel:${inquiry.phone}`}>
                        {inquiry.phone}
                      </a>
                      <button
                        className="small-button"
                        type="button"
                        onClick={() => void handleStatusChange(inquiry)}
                        disabled={savingInquiryId === inquiry.id}
                      >
                        {savingInquiryId === inquiry.id
                          ? "저장 중"
                          : inquiry.status === "NEW"
                            ? "확인 처리"
                            : "새 문의로 되돌리기"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
      ) : null}
    </main>
  );
}
