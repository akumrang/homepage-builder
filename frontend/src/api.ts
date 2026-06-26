import type {
  AcademySite,
  AcademySummary,
  Inquiry,
  InquiryInput,
  InquiryStatusInput,
  NoticeInput,
  NoticeItem,
  ProductionStatusInput,
  ContentReviewResult
} from "./types";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4200";
const internalAccessTokenStorageKey = "muksan-homepage-internal-access-token";

export class ApiRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function getInternalAccessToken(): string {
  return window.sessionStorage.getItem(internalAccessTokenStorageKey) ?? "";
}

export function setInternalAccessToken(token: string): void {
  window.sessionStorage.setItem(internalAccessTokenStorageKey, token);
}

export function clearInternalAccessToken(): void {
  window.sessionStorage.removeItem(internalAccessTokenStorageKey);
}

function internalHeaders(hasBody = false): HeadersInit {
  const headers: Record<string, string> = hasBody ? { "Content-Type": "application/json" } : {};
  const token = getInternalAccessToken().trim();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new ApiRequestError(body.message ?? "요청을 처리하지 못했습니다.", response.status);
  }

  return body;
}

export async function fetchAcademy(slug: string): Promise<AcademySite> {
  const response = await fetch(`${apiBaseUrl}/api/academies/${slug}`);
  const data = await readJson<{ academy: AcademySite }>(response);
  return data.academy;
}

export async function fetchAcademies(): Promise<AcademySummary[]> {
  const response = await fetch(`${apiBaseUrl}/api/academies`, {
    headers: internalHeaders()
  });
  const data = await readJson<{ academies: AcademySummary[] }>(response);
  return data.academies;
}

export async function fetchInquiries(): Promise<Inquiry[]> {
  const response = await fetch(`${apiBaseUrl}/api/inquiries`, {
    headers: internalHeaders()
  });
  const data = await readJson<{ inquiries: Inquiry[] }>(response);
  return data.inquiries;
}

export async function submitInquiry(input: InquiryInput): Promise<{ inquiry: Inquiry; message: string }> {
  const response = await fetch(`${apiBaseUrl}/api/inquiries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  return readJson<{ inquiry: Inquiry; message: string }>(response);
}

export async function updateInquiryStatus(
  id: string,
  input: InquiryStatusInput
): Promise<{ inquiry: Inquiry }> {
  const response = await fetch(`${apiBaseUrl}/api/inquiries/${id}/status`, {
    method: "PATCH",
    headers: internalHeaders(true),
    body: JSON.stringify(input)
  });

  return readJson<{ inquiry: Inquiry }>(response);
}

export async function fetchNotices(academySlug: string): Promise<NoticeItem[]> {
  const response = await fetch(`${apiBaseUrl}/api/academies/${academySlug}/notices`, {
    headers: internalHeaders()
  });
  const data = await readJson<{ notices: NoticeItem[] }>(response);
  return data.notices;
}

export async function fetchContentReview(academySlug: string): Promise<ContentReviewResult> {
  const response = await fetch(`${apiBaseUrl}/api/academies/${academySlug}/content-checks`, {
    headers: internalHeaders()
  });
  return readJson<ContentReviewResult>(response);
}

export async function createNotice(academySlug: string, input: NoticeInput): Promise<{ notice: NoticeItem }> {
  const response = await fetch(`${apiBaseUrl}/api/academies/${academySlug}/notices`, {
    method: "POST",
    headers: internalHeaders(true),
    body: JSON.stringify(input)
  });

  return readJson<{ notice: NoticeItem }>(response);
}

export async function updateNotice(id: string, input: NoticeInput): Promise<{ notice: NoticeItem }> {
  const response = await fetch(`${apiBaseUrl}/api/notices/${id}`, {
    method: "PATCH",
    headers: internalHeaders(true),
    body: JSON.stringify(input)
  });

  return readJson<{ notice: NoticeItem }>(response);
}

export async function deleteNotice(id: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/notices/${id}`, {
    method: "DELETE",
    headers: internalHeaders()
  });

  if (!response.ok) {
    await readJson(response);
  }
}

export async function updateAcademyProductionStatus(
  slug: string,
  input: ProductionStatusInput
): Promise<{ academy: AcademySummary }> {
  const response = await fetch(`${apiBaseUrl}/api/academies/${slug}/status`, {
    method: "PATCH",
    headers: internalHeaders(true),
    body: JSON.stringify(input)
  });

  return readJson<{ academy: AcademySummary }>(response);
}
