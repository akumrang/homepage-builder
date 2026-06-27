import { useEffect, useState } from "react";
import InquiryForm from "./InquiryForm";
import type { AcademySite } from "../types";

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
}

export default function TrustBasicTemplate({ academy }: { academy: AcademySite }) {
  const [isConsultationVisible, setIsConsultationVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("consultation");

    if (!target || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsConsultationVisible(entry.isIntersecting && entry.intersectionRatio > 0.08);
      },
      { threshold: [0, 0.08, 0.2] }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label={`${academy.name} 처음으로`}>
          <span>{academy.name}</span>
        </a>
        <nav aria-label="홈페이지 주요 메뉴">
          <a href="#about">소개</a>
          <a href="#teachers">강사진</a>
          <a href="#curriculum">커리큘럼</a>
          <a href="#notice">공지</a>
          <a href="#location">오시는 길</a>
        </nav>
        <a className="header-cta" href="#consultation">
          상담 신청
        </a>
      </header>

      <main id="top">
        <section className="hero" style={{ backgroundImage: `url(${academy.heroImage})` }}>
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="hero-kicker">국어 · 독서 · 서술형</p>
            <h1>{academy.name}</h1>
            <p className="hero-tagline">{academy.tagline}</p>
            <p className="hero-summary">{academy.summary}</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#consultation">
                상담 문의하기
              </a>
              <a className="button button-ghost" href={`tel:${academy.location.phone}`}>
                전화 상담
              </a>
            </div>
            <div className="hero-facts" aria-label="학원 핵심 정보">
              <span>{academy.subjects.join(" · ")}</span>
              <span>{academy.targetGrades.join(" · ")}</span>
              <span>{academy.location.transit}</span>
            </div>
          </div>
        </section>

        <section className="quick-band" aria-label="빠른 정보">
          <div>
            <strong>상담 가능</strong>
            <span>{academy.consultation.availableTime}</span>
          </div>
          <div>
            <strong>위치</strong>
            <span>{academy.location.address}</span>
          </div>
          <div>
            <strong>대상</strong>
            <span>{academy.targetGrades.join(", ")}</span>
          </div>
        </section>

        <section className="content-section" id="strengths">
          <SectionHeading
            eyebrow="Why this academy"
            title="학습 습관을 만드는 세 가지 기준"
            body="샘플 데이터 기반 문구이며, 실적이나 후기처럼 오해될 수 있는 표현은 사용하지 않습니다."
          />
          <div className="card-grid three">
            {academy.strengths.map((strength) => (
              <article className="info-card" key={strength.title}>
                <h3>{strength.title}</h3>
                <p>{strength.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section muted-section" id="about">
          <div className="two-column">
            <SectionHeading eyebrow="About" title="학원 소개" />
            <div className="story-stack">
              <p>{academy.introduction.philosophy}</p>
              <p>{academy.introduction.operation}</p>
              <p>{academy.introduction.management}</p>
            </div>
          </div>
        </section>

        <section className="content-section" id="teachers">
          <SectionHeading eyebrow="Teachers" title="강사진" body="공개 가능한 수업 방식 중심으로 소개합니다." />
          <div className="card-grid two">
            {academy.teachers.map((teacher) => (
              <article className="teacher-card" key={teacher.name}>
                <div className="teacher-mark" aria-hidden="true">
                  {teacher.name.slice(0, 1)}
                </div>
                <div>
                  <p>{teacher.role}</p>
                  <h3>{teacher.name}</h3>
                  <dl>
                    <div>
                      <dt>담당</dt>
                      <dd>{teacher.grades}</dd>
                    </div>
                    <div>
                      <dt>수업</dt>
                      <dd>{teacher.focus}</dd>
                    </div>
                  </dl>
                  <small>{teacher.note}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section muted-section" id="curriculum">
          <SectionHeading
            eyebrow="Curriculum"
            title="학년별 국어 커리큘럼"
            body="현재 수준과 학교 흐름에 맞춰 상담 후 반을 안내합니다."
          />
          <div className="track-list">
            {academy.curriculum.map((track) => (
              <article className="track-row" key={track.title}>
                <div>
                  <p>{track.grades}</p>
                  <h3>{track.title}</h3>
                </div>
                <p>{track.goal}</p>
                <span>{track.method}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section" id="schedule">
          <SectionHeading eyebrow="Classes" title="수업 안내" />
          <div className="schedule-table" role="table" aria-label="수업 안내">
            <div className="schedule-head" role="row">
              <span role="columnheader">요일</span>
              <span role="columnheader">시간</span>
              <span role="columnheader">대상</span>
              <span role="columnheader">수업</span>
            </div>
            {academy.schedules.map((schedule) => (
              <div className="schedule-row" role="row" key={`${schedule.day}-${schedule.className}`}>
                <span role="cell">{schedule.day}</span>
                <span role="cell">{schedule.time}</span>
                <span role="cell">{schedule.grade}</span>
                <span role="cell">
                  {schedule.subject} · {schedule.className}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="content-section muted-section" id="notice">
          <SectionHeading eyebrow="Notice" title="공지사항" />
          {academy.notices.length === 0 ? (
            <div className="empty-state">현재 공개된 공지사항이 없습니다.</div>
          ) : (
            <div className="notice-list">
              {academy.notices.map((notice) => (
                <article className="notice-item" key={notice.id}>
                  <div>
                    <time dateTime={notice.date}>{notice.date}</time>
                    {notice.pinned ? <span>중요</span> : null}
                  </div>
                  <h3>{notice.title}</h3>
                  <p>{notice.body}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="content-section consultation-section" id="consultation">
          <div className="two-column consultation-layout">
            <div>
              <p className="eyebrow">Consultation</p>
              <h2>상담 문의</h2>
              <p>{academy.consultation.description}</p>
              <div className="contact-box">
                <strong>{academy.location.phone}</strong>
                <span>{academy.consultation.availableTime}</span>
              </div>
            </div>
            <InquiryForm academySlug={academy.slug} />
          </div>
        </section>

        <section className="content-section location-section" id="location">
          <SectionHeading eyebrow="Location" title="오시는 길" />
          <div className="location-grid">
            <div className="map-placeholder" aria-label="지도 영역">
              <strong>{academy.name}</strong>
              <span>{academy.location.transit}</span>
            </div>
            <dl className="location-list">
              <div>
                <dt>주소</dt>
                <dd>{academy.location.address}</dd>
              </div>
              <div>
                <dt>운영 시간</dt>
                <dd>{academy.location.hours}</dd>
              </div>
              <div>
                <dt>교통</dt>
                <dd>{academy.location.transit}</dd>
              </div>
              <div>
                <dt>주차</dt>
                <dd>{academy.location.parking}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="entry-band" id="admin-entry">
          <div>
            <p className="eyebrow">Muksan SaaS Entry</p>
            <h2>재원생 결제와 관리자 진입</h2>
            <p>이번 MVP에서는 실제 결제와 외부 시스템 연동 없이 진입 구조만 표시합니다.</p>
          </div>
          <div className="entry-actions">
            <a className="button button-secondary" href={academy.links.payment} id="payment">
              수강료 결제 안내
            </a>
            <a className="button button-secondary" href={academy.links.academyAdmin}>
              학원관리 진입
            </a>
            <a className="button button-secondary" href={academy.links.examAdmin} id="exam-entry">
              시험지 생성관리 진입
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>{academy.name}</span>
        <span>샘플 홈페이지 · 실제 개인정보 없음</span>
        <a href="#consultation">상담 문의</a>
      </footer>

      <div className={isConsultationVisible ? "mobile-action-bar is-hidden" : "mobile-action-bar"}>
        <a href={`tel:${academy.location.phone}`}>전화</a>
        <a href="#consultation">상담 신청</a>
      </div>
    </div>
  );
}
