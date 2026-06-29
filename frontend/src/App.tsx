import { useEffect, useMemo, useState } from "react";
import { fetchAcademy } from "./api";
import InternalDashboard from "./components/InternalDashboard";
import TrustBasicTemplate from "./components/TrustBasicTemplate";
import type { AcademySite } from "./types";

function getRoute() {
  const pathname = window.location.pathname;
  const academyMatch = pathname.match(/^\/h\/([^/]+)\/?$/);

  if (academyMatch) {
    return { type: "academy" as const, slug: academyMatch[1] };
  }

  if (pathname === "/internal" || pathname === "/admin" || pathname === "/studio") {
    return { type: "internal" as const };
  }

  return { type: "home" as const };
}

function AcademyPage({ slug }: { slug: string }) {
  const [academy, setAcademy] = useState<AcademySite | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    fetchAcademy(slug)
      .then((data) => {
        if (!ignore) setAcademy(data);
      })
      .catch((requestError: Error) => {
        if (!ignore) setError(requestError.message);
      });

    return () => {
      ignore = true;
    };
  }, [slug]);

  if (error) {
    return (
      <main className="plain-state">
        <p className="eyebrow">홈페이지를 불러오지 못했습니다</p>
        <h1>{error}</h1>
        <a className="button button-primary" href="/internal">
          내부 화면으로 이동
        </a>
      </main>
    );
  }

  if (!academy) {
    return (
      <main className="plain-state">
        <p className="eyebrow">Bettle System Homepage</p>
        <h1>샘플 홈페이지를 불러오는 중입니다.</h1>
      </main>
    );
  }

  return <TrustBasicTemplate academy={academy} />;
}

function HomeEntry() {
  return (
    <main className="plain-state">
      <p className="eyebrow">Bettle System Homepage MVP</p>
      <h1>샘플 학원 홈페이지와 내부 제작 화면</h1>
      <div className="plain-actions">
        <a className="button button-primary" href="/h/sample-korean-academy">
          샘플 홈페이지 보기
        </a>
        <a className="button button-secondary" href="/internal">
          내부 화면 보기
        </a>
      </div>
    </main>
  );
}

export default function App() {
  const route = useMemo(() => getRoute(), []);

  if (route.type === "academy") return <AcademyPage slug={route.slug} />;
  if (route.type === "internal") return <InternalDashboard />;
  return <HomeEntry />;
}
