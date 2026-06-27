import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { app, initializeStores } from "./server.js";
import {
  getInternalAccessConfigurationStatus,
  minimumProductionInternalAccessTokenLength
} from "./internalAccess.js";
import { academySites } from "./sampleAcademies.js";
import { getAcademyContentChecks } from "./contentValidation.js";
import { prisma } from "./prismaClient.js";
import type { AcademySite, ContentCheck } from "./types.js";

const academySlug = "sample-korean-academy";
const internalAccessToken = process.env.HOMEPAGE_INTERNAL_ACCESS_TOKEN?.trim() || "muksan-local-dev";

interface JsonRequestOptions {
  body?: unknown;
  expectedStatus: number;
  headers?: Record<string, string>;
  label: string;
  method?: "DELETE" | "GET" | "PATCH" | "POST";
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function startSmokeServer(): Promise<{ baseUrl: string; server: Server }> {
  await initializeStores();

  const server = await new Promise<Server>((resolve, reject) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    instance.on("error", reject);
  });

  const address = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    server
  };
}

async function stopSmokeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function requestJson(baseUrl: string, path: string, options: JsonRequestOptions): Promise<unknown> {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers
  };
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (response.status !== options.expectedStatus) {
    throw new Error(
      `${options.label} expected HTTP ${options.expectedStatus}, got ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

function internalHeaders() {
  return {
    Authorization: `Bearer ${internalAccessToken}`
  };
}

function setOptionalEnvValue(name: string, value: string | undefined): void {
  if (typeof value === "undefined") {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

function assertInternalAccessConfigurationRules(): void {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalInternalAccessToken = process.env.HOMEPAGE_INTERNAL_ACCESS_TOKEN;

  try {
    process.env.NODE_ENV = "production";
    delete process.env.HOMEPAGE_INTERNAL_ACCESS_TOKEN;
    assert(
      getInternalAccessConfigurationStatus().ok === false,
      "production internal access config must reject missing token."
    );

    process.env.HOMEPAGE_INTERNAL_ACCESS_TOKEN = "   ";
    assert(
      getInternalAccessConfigurationStatus().ok === false,
      "production internal access config must reject blank tokens."
    );

    process.env.HOMEPAGE_INTERNAL_ACCESS_TOKEN = "muksan-local-dev";
    assert(
      getInternalAccessConfigurationStatus().ok === false,
      "production internal access config must reject the local development token."
    );

    process.env.HOMEPAGE_INTERNAL_ACCESS_TOKEN = "short-token";
    assert(
      getInternalAccessConfigurationStatus().ok === false,
      "production internal access config must reject short tokens."
    );

    process.env.HOMEPAGE_INTERNAL_ACCESS_TOKEN = "a".repeat(minimumProductionInternalAccessTokenLength);
    assert(
      getInternalAccessConfigurationStatus().ok === true,
      "production internal access config must accept a strong token."
    );

    process.env.NODE_ENV = "development";
    delete process.env.HOMEPAGE_INTERNAL_ACCESS_TOKEN;
    const localFallbackStatus = getInternalAccessConfigurationStatus();
    assert(localFallbackStatus.ok === true, "local internal access config must allow default fallback token.");
    assert(
      localFallbackStatus.usingDefaultLocalToken === true,
      "local internal access config must report default fallback token usage."
    );
  } finally {
    setOptionalEnvValue("NODE_ENV", originalNodeEnv);
    setOptionalEnvValue("HOMEPAGE_INTERNAL_ACCESS_TOKEN", originalInternalAccessToken);
  }
}

function createCustomerPublishedFixture(source: AcademySite): AcademySite {
  const fixture = JSON.parse(
    JSON.stringify(source)
      .replaceAll("샘플", "고객")
      .replaceAll("sample", "customer")
      .replaceAll("실제 개인정보 없음", "게시 승인 완료")
      .replaceAll("실제 개인정보를 포함하지 않습니다", "공개 승인된 수업 방식만 소개합니다")
      .replaceAll("확인되지 않은 경력이나 실적은 표시하지 않습니다", "공개 승인된 수업 방식만 표시합니다")
  ) as AcademySite;

  return {
    ...fixture,
    id: "homepage_customer_published_fixture",
    academyId: "academy_customer_fixture_001",
    slug: "customer-korean-academy",
    productionStatus: "PUBLISHED",
    publication: {
      mode: "CUSTOMER_PUBLISHED",
      sampleDisclosureVisible: false,
      customerApprovedForPublish: true,
      heroAssetApproved: true,
      footerNote: "서울시 묵산구 배움로 12, 3층"
    },
    name: "한빛국어학원",
    heroImage: "/assets/customer-approved-hero.png",
    location: {
      ...fixture.location,
      address: "서울시 묵산구 배움로 12, 3층",
      phone: "02-1234-5678"
    }
  };
}

function findContentCheck(checks: ContentCheck[], key: string): ContentCheck {
  const check = checks.find((item) => item.key === key);
  assert(check, `content checks must include ${key}.`);
  return check;
}

function assertCustomerPublishedContentValidationRules(): void {
  const sourceAcademy = academySites.find((academy) => academy.slug === academySlug);
  assert(sourceAcademy, "customer published fixture source academy must exist.");

  const validPublishedAcademy = createCustomerPublishedFixture(sourceAcademy);
  const validResidueCheck = findContentCheck(
    getAcademyContentChecks(validPublishedAcademy),
    "customerPublishedSampleResidue"
  );
  assert(validResidueCheck.ok, "customer published fixture without sample copy must pass residue validation.");

  const invalidPublishedAcademy = createCustomerPublishedFixture(sourceAcademy);
  invalidPublishedAcademy.publication.footerNote = "샘플 홈페이지 · 실제 개인정보 없음";
  invalidPublishedAcademy.teachers[0] = {
    ...invalidPublishedAcademy.teachers[0],
    note: "샘플 공개 프로필입니다."
  };

  const invalidResidueCheck = findContentCheck(
    getAcademyContentChecks(invalidPublishedAcademy),
    "customerPublishedSampleResidue"
  );
  assert(!invalidResidueCheck.ok, "customer published fixture with sample copy must fail residue validation.");
  assert(
    invalidResidueCheck.value.includes("publication.footerNote") ||
      invalidResidueCheck.value.includes("teachers[0].note"),
    "customer published residue validation must report the source field."
  );
}

async function main() {
  let server: Server | null = null;
  let createdInquiryId: string | null = null;
  let createdNoticeId: string | null = null;
  let originalProductionStatus: string | null = null;

  try {
    assertInternalAccessConfigurationRules();
    assertCustomerPublishedContentValidationRules();

    const started = await startSmokeServer();
    server = started.server;

    const health = await requestJson(started.baseUrl, "/api/health", {
      expectedStatus: 200,
      label: "health"
    });
    assert(typeof health === "object" && health !== null && "ok" in health, "health response must include ok.");
    assert(health.ok === true, "health response must be ok.");

    const allowedCorsHealth = await fetch(`${started.baseUrl}/api/health`, {
      headers: { Origin: "http://localhost:5175" }
    });
    assert(allowedCorsHealth.status === 200, "allowed CORS health request must succeed.");
    assert(
      allowedCorsHealth.headers.get("access-control-allow-origin") === "http://localhost:5175",
      "allowed CORS origin must be reflected in the response header."
    );

    const blockedCorsHealth = await fetch(`${started.baseUrl}/api/health`, {
      headers: { Origin: "https://blocked.example" }
    });
    assert(blockedCorsHealth.status === 200, "blocked CORS health request still reaches the API.");
    assert(
      blockedCorsHealth.headers.get("access-control-allow-origin") === null,
      "blocked CORS origin must not receive an allow-origin response header."
    );

    const readiness = await requestJson(started.baseUrl, "/api/ready", {
      expectedStatus: 200,
      label: "readiness"
    });
    assert(
      typeof readiness === "object" && readiness !== null && "ok" in readiness,
      "readiness response must include ok."
    );
    assert(readiness.ok === true, "readiness response must be ok.");
    assert(
      "checks" in readiness && Array.isArray(readiness.checks),
      "readiness response must include checks."
    );
    const readinessCheckNames = readiness.checks.map((check: { name?: string }) => check.name);
    for (const expectedCheckName of [
      "academy-seed",
      "internal-access-token",
      "database",
      "homepage-state-store",
      "inquiry-store",
      "notice-store"
    ]) {
      assert(
        readinessCheckNames.includes(expectedCheckName),
        `readiness checks must include ${expectedCheckName}.`
      );
    }

    const protectedAcademyListRejected = await requestJson(started.baseUrl, "/api/academies", {
      expectedStatus: 401,
      label: "protected academy list without internal token"
    });
    assert(
      JSON.stringify(protectedAcademyListRejected).includes("내부 접근"),
      "protected academy list must reject requests without an internal token."
    );

    const academyList = await requestJson(started.baseUrl, "/api/academies", {
      expectedStatus: 200,
      headers: internalHeaders(),
      label: "protected academy list with internal token"
    });
    assert(
      typeof academyList === "object" &&
        academyList !== null &&
        "academies" in academyList &&
        Array.isArray(academyList.academies),
      "protected academy list response must include academies."
    );
    assert(academyList.academies.length > 0, "protected academy list must include at least one academy.");
    const academySummary = academyList.academies.find((academy: { slug?: string }) => academy.slug === academySlug);
    assert(
      typeof academySummary === "object" &&
        academySummary !== null &&
        "productionStatus" in academySummary &&
        typeof academySummary.productionStatus === "string",
      "protected academy summary must include productionStatus."
    );
    originalProductionStatus = academySummary.productionStatus;

    const protectedContentChecksRejected = await requestJson(started.baseUrl, `/api/academies/${academySlug}/content-checks`, {
      expectedStatus: 401,
      label: "protected content checks without internal token"
    });
    assert(
      JSON.stringify(protectedContentChecksRejected).includes("내부 접근"),
      "protected content checks must reject requests without an internal token."
    );

    const contentChecks = await requestJson(started.baseUrl, `/api/academies/${academySlug}/content-checks`, {
      expectedStatus: 200,
      headers: internalHeaders(),
      label: "content checks"
    });
    assert(
      typeof contentChecks === "object" && contentChecks !== null && "checks" in contentChecks,
      "content checks response must include checks."
    );
    assert(Array.isArray(contentChecks.checks), "content checks must be an array.");
    assert(contentChecks.checks.length > 0, "content checks must include at least one check.");
    assert(
      "readiness" in contentChecks &&
        typeof contentChecks.readiness === "object" &&
        contentChecks.readiness !== null &&
        "status" in contentChecks.readiness &&
        contentChecks.readiness.status === "READY",
      "content checks response must include READY readiness."
    );
    assert(
      "score" in contentChecks.readiness &&
        typeof contentChecks.readiness.score === "number" &&
        contentChecks.readiness.score === 100,
      "sample academy content readiness score must be 100."
    );

    const requiredFailures = contentChecks.checks.filter(
      (check: { ok?: boolean; severity?: string }) => check.severity === "required" && check.ok !== true
    );
    assert(requiredFailures.length === 0, `required content checks failed: ${JSON.stringify(requiredFailures)}`);
    assert(
      contentChecks.checks.some((check: { key?: string; ok?: boolean }) => check.key === "publicationMode" && check.ok),
      "content checks must include a passing publicationMode check."
    );
    assert(
      contentChecks.checks.some(
        (check: { key?: string; ok?: boolean }) => check.key === "customerPublishedSampleResidue" && check.ok
      ),
      "content checks must include a passing customerPublishedSampleResidue check."
    );

    const academyDetail = await requestJson(started.baseUrl, `/api/academies/${academySlug}`, {
      expectedStatus: 200,
      label: "academy detail"
    });
    assert(
      typeof academyDetail === "object" && academyDetail !== null && "academy" in academyDetail,
      "academy detail response must include academy."
    );
    assert(
      typeof academyDetail.academy === "object" &&
        academyDetail.academy !== null &&
        !("productionStatus" in academyDetail.academy),
      "public academy detail response must not expose productionStatus."
    );
    assert(
      "publication" in academyDetail.academy &&
        typeof academyDetail.academy.publication === "object" &&
        academyDetail.academy.publication !== null &&
        "mode" in academyDetail.academy.publication &&
        academyDetail.academy.publication.mode === "SAMPLE",
      "public academy detail response must expose publication mode."
    );

    const targetProductionStatus =
      originalProductionStatus === "INTERNAL_REVIEW" ? "CUSTOMER_REVIEW" : "INTERNAL_REVIEW";
    const updatedAcademyStatus = await requestJson(started.baseUrl, `/api/academies/${academySlug}/status`, {
      body: { productionStatus: targetProductionStatus },
      expectedStatus: 200,
      headers: internalHeaders(),
      label: "academy production status update",
      method: "PATCH"
    });
    assert(
      typeof updatedAcademyStatus === "object" && updatedAcademyStatus !== null && "academy" in updatedAcademyStatus,
      "academy production status update response must include academy."
    );
    assert(
      typeof updatedAcademyStatus.academy === "object" &&
        updatedAcademyStatus.academy !== null &&
        "productionStatus" in updatedAcademyStatus.academy &&
        updatedAcademyStatus.academy.productionStatus === targetProductionStatus,
      "academy production status update must return the requested status."
    );

    const invalidAcademyStatus = await requestJson(started.baseUrl, `/api/academies/${academySlug}/status`, {
      body: { productionStatus: "ARCHIVED" },
      expectedStatus: 400,
      headers: internalHeaders(),
      label: "invalid academy production status",
      method: "PATCH"
    });
    assert(
      JSON.stringify(invalidAcademyStatus).includes("제작 상태"),
      "invalid academy production status response must mention production status."
    );

    const noticePayload = {
      title: "스모크 테스트 공지",
      date: "2026-06-25",
      body: "backend API smoke test 공지사항입니다.",
      pinned: false,
      visible: true
    };

    const createdNotice = await requestJson(started.baseUrl, `/api/academies/${academySlug}/notices`, {
      body: noticePayload,
      expectedStatus: 201,
      headers: internalHeaders(),
      label: "notice create",
      method: "POST"
    });
    assert(
      typeof createdNotice === "object" && createdNotice !== null && "notice" in createdNotice,
      "notice create response must include notice."
    );
    assert(
      typeof createdNotice.notice === "object" &&
        createdNotice.notice !== null &&
        "id" in createdNotice.notice &&
        typeof createdNotice.notice.id === "string",
      "notice create response must include notice.id."
    );
    createdNoticeId = createdNotice.notice.id;

    const internalNoticesAfterCreate = await requestJson(started.baseUrl, `/api/academies/${academySlug}/notices`, {
      expectedStatus: 200,
      headers: internalHeaders(),
      label: "internal notices after create"
    });
    assert(
      typeof internalNoticesAfterCreate === "object" &&
        internalNoticesAfterCreate !== null &&
        "notices" in internalNoticesAfterCreate &&
        Array.isArray(internalNoticesAfterCreate.notices),
      "internal notices response must include notices."
    );
    assert(
      internalNoticesAfterCreate.notices.some((notice: { id?: string }) => notice.id === createdNoticeId),
      "created notice must be visible in internal notice list."
    );

    const publicAcademyAfterCreate = await requestJson(started.baseUrl, `/api/academies/${academySlug}`, {
      expectedStatus: 200,
      label: "public academy after notice create"
    });
    assert(
      typeof publicAcademyAfterCreate === "object" &&
        publicAcademyAfterCreate !== null &&
        "academy" in publicAcademyAfterCreate &&
        typeof publicAcademyAfterCreate.academy === "object" &&
        publicAcademyAfterCreate.academy !== null &&
        "notices" in publicAcademyAfterCreate.academy &&
        Array.isArray(publicAcademyAfterCreate.academy.notices),
      "public academy response must include notices."
    );
    assert(
      publicAcademyAfterCreate.academy.notices.some((notice: { id?: string }) => notice.id === createdNoticeId),
      "visible notice must be included in public academy notices."
    );

    const hiddenNotice = await requestJson(started.baseUrl, `/api/notices/${createdNoticeId}`, {
      body: { ...noticePayload, title: "스모크 테스트 비공개 공지", visible: false },
      expectedStatus: 200,
      headers: internalHeaders(),
      label: "notice update hidden",
      method: "PATCH"
    });
    assert(
      typeof hiddenNotice === "object" &&
        hiddenNotice !== null &&
        "notice" in hiddenNotice &&
        typeof hiddenNotice.notice === "object" &&
        hiddenNotice.notice !== null &&
        "visible" in hiddenNotice.notice &&
        hiddenNotice.notice.visible === false,
      "notice update must return visible=false."
    );

    const internalNoticesAfterHide = await requestJson(started.baseUrl, `/api/academies/${academySlug}/notices`, {
      expectedStatus: 200,
      headers: internalHeaders(),
      label: "internal notices after hide"
    });
    assert(
      typeof internalNoticesAfterHide === "object" &&
        internalNoticesAfterHide !== null &&
        "notices" in internalNoticesAfterHide &&
        Array.isArray(internalNoticesAfterHide.notices),
      "internal notices after hide response must include notices."
    );
    assert(
      internalNoticesAfterHide.notices.some((notice: { id?: string; visible?: boolean }) => notice.id === createdNoticeId && notice.visible === false),
      "hidden notice must remain visible in internal notice list."
    );

    const publicAcademyAfterHide = await requestJson(started.baseUrl, `/api/academies/${academySlug}`, {
      expectedStatus: 200,
      label: "public academy after notice hide"
    });
    assert(
      typeof publicAcademyAfterHide === "object" &&
        publicAcademyAfterHide !== null &&
        "academy" in publicAcademyAfterHide &&
        typeof publicAcademyAfterHide.academy === "object" &&
        publicAcademyAfterHide.academy !== null &&
        "notices" in publicAcademyAfterHide.academy &&
        Array.isArray(publicAcademyAfterHide.academy.notices),
      "public academy after hide response must include notices."
    );
    assert(
      !publicAcademyAfterHide.academy.notices.some((notice: { id?: string }) => notice.id === createdNoticeId),
      "hidden notice must not be included in public academy notices."
    );

    await requestJson(started.baseUrl, `/api/notices/${createdNoticeId}`, {
      expectedStatus: 204,
      headers: internalHeaders(),
      label: "notice delete",
      method: "DELETE"
    });
    const deletedNoticeId = createdNoticeId;
    createdNoticeId = null;

    const internalNoticesAfterDelete = await requestJson(started.baseUrl, `/api/academies/${academySlug}/notices`, {
      expectedStatus: 200,
      headers: internalHeaders(),
      label: "internal notices after delete"
    });
    assert(
      typeof internalNoticesAfterDelete === "object" &&
        internalNoticesAfterDelete !== null &&
        "notices" in internalNoticesAfterDelete &&
        Array.isArray(internalNoticesAfterDelete.notices),
      "internal notices after delete response must include notices."
    );
    assert(
      !internalNoticesAfterDelete.notices.some((notice: { id?: string }) => notice.id === deletedNoticeId),
      "deleted notice must be removed from internal notice list."
    );

    const inquiryPayload = {
      academySlug,
      parentName: "스모크 테스트 보호자",
      phone: "010-0000-0000",
      studentGrade: "중2",
      subject: "국어",
      message: "backend API smoke test 상담 문의입니다.",
      privacyAccepted: true
    };

    const createdInquiry = await requestJson(started.baseUrl, "/api/inquiries", {
      body: inquiryPayload,
      expectedStatus: 201,
      label: "valid inquiry",
      method: "POST"
    });
    assert(
      typeof createdInquiry === "object" && createdInquiry !== null && "inquiry" in createdInquiry,
      "valid inquiry response must include inquiry."
    );
    assert(
      typeof createdInquiry.inquiry === "object" &&
        createdInquiry.inquiry !== null &&
        "id" in createdInquiry.inquiry &&
        typeof createdInquiry.inquiry.id === "string",
      "valid inquiry response must include inquiry.id."
    );
    createdInquiryId = createdInquiry.inquiry.id;

    const inquiryList = await requestJson(started.baseUrl, "/api/inquiries", {
      expectedStatus: 200,
      headers: internalHeaders(),
      label: "inquiry list"
    });
    assert(
      typeof inquiryList === "object" && inquiryList !== null && "inquiries" in inquiryList,
      "inquiry list response must include inquiries."
    );
    assert(Array.isArray(inquiryList.inquiries), "inquiries must be an array.");
    assert(
      inquiryList.inquiries.some((inquiry: { id?: string }) => inquiry.id === createdInquiryId),
      "created inquiry must be visible in inquiry list."
    );

    const checkedInquiry = await requestJson(started.baseUrl, `/api/inquiries/${createdInquiryId}/status`, {
      body: { status: "CHECKED" },
      expectedStatus: 200,
      headers: internalHeaders(),
      label: "inquiry status update",
      method: "PATCH"
    });
    assert(
      typeof checkedInquiry === "object" && checkedInquiry !== null && "inquiry" in checkedInquiry,
      "inquiry status update response must include inquiry."
    );
    assert(
      typeof checkedInquiry.inquiry === "object" &&
        checkedInquiry.inquiry !== null &&
        "status" in checkedInquiry.inquiry &&
        checkedInquiry.inquiry.status === "CHECKED",
      "inquiry status update must return CHECKED status."
    );

    const invalidStatusResponse = await requestJson(started.baseUrl, `/api/inquiries/${createdInquiryId}/status`, {
      body: { status: "ARCHIVED" },
      expectedStatus: 400,
      headers: internalHeaders(),
      label: "invalid inquiry status",
      method: "PATCH"
    });
    assert(
      JSON.stringify(invalidStatusResponse).includes("NEW") && JSON.stringify(invalidStatusResponse).includes("CHECKED"),
      "invalid inquiry status response must describe allowed statuses."
    );

    const invalidPhoneInquiry = await requestJson(started.baseUrl, "/api/inquiries", {
      body: { ...inquiryPayload, parentName: "잘못된 연락처", phone: "02-123-4567" },
      expectedStatus: 400,
      label: "invalid inquiry phone",
      method: "POST"
    });
    assert(
      JSON.stringify(invalidPhoneInquiry).includes("휴대전화"),
      "invalid inquiry phone response must mention mobile phone format."
    );

    const shortMessageInquiry = await requestJson(started.baseUrl, "/api/inquiries", {
      body: { ...inquiryPayload, parentName: "짧은 문의", message: "짧음" },
      expectedStatus: 400,
      label: "short inquiry message",
      method: "POST"
    });
    assert(
      JSON.stringify(shortMessageInquiry).includes("10자"),
      "short inquiry message response must mention minimum length."
    );

    const rejectedInquiry = await requestJson(started.baseUrl, "/api/inquiries", {
      body: { ...inquiryPayload, parentName: "동의 없음", privacyAccepted: false },
      expectedStatus: 400,
      label: "privacy rejected inquiry",
      method: "POST"
    });
    assert(
      JSON.stringify(rejectedInquiry).includes("개인정보"),
      "privacy rejected inquiry response must mention privacy consent."
    );

    console.log(
      "[api:smoke] passed: health, CORS origin guard, readiness, internal access config guard, internal access protection, content checks, academy status PATCH, notice CRUD, inquiry POST, inquiry validation, inquiry status PATCH, privacy rejection."
    );
  } finally {
    if (originalProductionStatus) {
      await prisma.homepageSiteState
        .update({
          where: { slug: academySlug },
          data: { productionStatus: originalProductionStatus }
        })
        .catch(() => undefined);
    }

    if (createdInquiryId) {
      await prisma.inquiry.delete({ where: { id: createdInquiryId } }).catch(() => undefined);
    }

    if (createdNoticeId) {
      await prisma.notice.delete({ where: { id: createdNoticeId } }).catch(() => undefined);
    }

    if (server) {
      await stopSmokeServer(server);
    }

    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[api:smoke] failed: ${message}`);
  process.exitCode = 1;
});
