import type {
  AcademySite,
  ContentCheck,
  ContentReadiness,
  ContentReviewResult,
  ProductionStatus,
  PublicationMode,
  TemplateId
} from "./types.js";

const allowedTemplateIds: TemplateId[] = ["trust-basic-v1"];
const allowedPublicationModes: PublicationMode[] = ["SAMPLE", "CUSTOMER_PREVIEW", "CUSTOMER_PUBLISHED"];
const allowedProductionStatuses: ProductionStatus[] = [
  "REQUESTED",
  "WAITING_FOR_MATERIALS",
  "MATERIALS_READY",
  "DRAFT_CREATED",
  "INTERNAL_REVIEW",
  "CUSTOMER_REVIEW",
  "APPROVED",
  "PUBLISHED"
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function requireString(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  if (!isNonEmptyString(record[key])) {
    errors.push(`${path}.${key} is required.`);
  }
}

function requireStringFields(value: unknown, fields: string[], path: string, errors: string[]) {
  if (!isObject(value)) {
    errors.push(`${path} must be an object.`);
    return;
  }

  for (const field of fields) {
    requireString(value, field, path, errors);
  }
}

function requireObjectArray(
  value: unknown,
  fields: string[],
  path: string,
  errors: string[],
  options: { minLength?: number; booleanFields?: string[] } = {}
) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`);
    return;
  }

  if (options.minLength && value.length < options.minLength) {
    errors.push(`${path} must contain at least ${options.minLength} item(s).`);
  }

  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isObject(item)) {
      errors.push(`${itemPath} must be an object.`);
      return;
    }

    for (const field of fields) {
      requireString(item, field, itemPath, errors);
    }

    for (const field of options.booleanFields ?? []) {
      if (!isBoolean(item[field])) {
        errors.push(`${itemPath}.${field} must be a boolean.`);
      }
    }
  });
}

interface AcademyContentCheckOptions {
  visibleNoticeCount?: number;
}

export function getAcademyContentChecks(academy: AcademySite, options: AcademyContentCheckOptions = {}): ContentCheck[] {
  const visibleNoticeCount = options.visibleNoticeCount ?? academy.notices.filter((notice) => notice.visible).length;

  return [
    {
      key: "publicationMode",
      label: "게시 모드",
      value: academy.publication.mode,
      ok: allowedPublicationModes.includes(academy.publication.mode),
      severity: "required",
      message: "샘플, 고객 미리보기, 실제 고객 게시 화면을 구분하는 기준입니다."
    },
    {
      key: "publicationFooter",
      label: "공개 footer 기준",
      value: academy.publication.footerNote ?? "",
      ok:
        academy.publication.mode === "SAMPLE"
          ? academy.publication.sampleDisclosureVisible && (academy.publication.footerNote?.includes("샘플") ?? false)
          : academy.publication.mode !== "CUSTOMER_PUBLISHED" ||
            (!academy.publication.sampleDisclosureVisible && academy.publication.customerApprovedForPublish),
      severity: "recommended",
      message: "샘플 footer와 실제 고객 게시용 footer가 섞이지 않도록 확인합니다."
    },
    {
      key: "name",
      label: "학원명",
      value: academy.name,
      ok: academy.name.trim().length > 0,
      severity: "required",
      message: "공개 홈페이지 첫 화면과 내부 목록에 표시됩니다."
    },
    {
      key: "tagline",
      label: "대표 문구",
      value: academy.tagline,
      ok: academy.tagline.trim().length > 0,
      severity: "required",
      message: "첫인상과 상담 전환에 직접 영향을 주는 문구입니다."
    },
    {
      key: "summary",
      label: "첫 화면 요약",
      value: academy.summary,
      ok: academy.summary.trim().length > 0,
      severity: "required",
      message: "학부모가 학원 성격을 빠르게 판단하는 공개 요약입니다."
    },
    {
      key: "targetGrades",
      label: "대상 학년",
      value: academy.targetGrades.join(", "),
      ok: academy.targetGrades.length > 0,
      severity: "required",
      message: "학부모가 우리 아이에게 맞는 학원인지 판단하는 기준입니다."
    },
    {
      key: "subjects",
      label: "대표 과목",
      value: academy.subjects.join(", "),
      ok: academy.subjects.length > 0,
      severity: "required",
      message: "검색 후 첫 판단에 필요한 핵심 정보입니다."
    },
    {
      key: "strengths",
      label: "강점 후보",
      value: `${academy.strengths.length}개`,
      ok: academy.strengths.length >= 3,
      severity: "required",
      message: "자료 수집 단계에서 고객이 강조하고 싶은 장점 3개 후보가 필요합니다."
    },
    {
      key: "phone",
      label: "연락처",
      value: academy.location.phone,
      ok: academy.location.phone.trim().length > 0,
      severity: "required",
      message: "전화 상담과 문의 확인에 필요한 공개 연락처입니다."
    },
    {
      key: "address",
      label: "주소",
      value: academy.location.address,
      ok: academy.location.address.trim().length > 0,
      severity: "required",
      message: "오시는 길 섹션에 표시되는 위치 정보입니다."
    },
    {
      key: "hours",
      label: "운영 시간",
      value: academy.location.hours,
      ok: academy.location.hours.trim().length > 0,
      severity: "required",
      message: "상담 가능 여부를 판단하기 위한 기본 운영 정보입니다."
    },
    {
      key: "consultation",
      label: "상담 안내",
      value: academy.consultation.description,
      ok: academy.consultation.description.trim().length > 0 && academy.consultation.availableTime.trim().length > 0,
      severity: "required",
      message: "상담 방식과 가능 시간을 공개 홈페이지에 안내해야 합니다."
    },
    {
      key: "teachers",
      label: "강사진",
      value: `${academy.teachers.length}명`,
      ok: academy.teachers.length > 0,
      severity: "required",
      message: "허위 경력 없이 공개 가능한 수업 담당자 정보가 필요합니다."
    },
    {
      key: "curriculum",
      label: "커리큘럼",
      value: `${academy.curriculum.length}개`,
      ok: academy.curriculum.length > 0,
      severity: "required",
      message: "대상 학년별 수업 흐름을 확인하는 영역입니다."
    },
    {
      key: "heroImage",
      label: "대표 이미지",
      value: academy.heroImage,
      ok: academy.heroImage.trim().length > 0,
      severity: "recommended",
      message: "사진이 없으면 기본 이미지로 시작할 수 있지만 실제 학원 신뢰도는 낮아질 수 있습니다."
    },
    {
      key: "schedules",
      label: "수업 안내",
      value: `${academy.schedules.length}개`,
      ok: academy.schedules.length > 0,
      severity: "recommended",
      message: "초기 MVP에서는 간단한 수업 운영 정보라도 있는 편이 좋습니다."
    },
    {
      key: "publicNotices",
      label: "공개 공지",
      value: `${visibleNoticeCount}건`,
      ok: visibleNoticeCount > 0,
      severity: "recommended",
      message: "학원이 실제 운영 중이라는 신뢰감을 주는 영역입니다."
    },
    {
      key: "transit",
      label: "교통 안내",
      value: academy.location.transit,
      ok: academy.location.transit.trim().length > 0,
      severity: "recommended",
      message: "방문 상담 전환을 돕는 오시는 길 보강 정보입니다."
    },
    {
      key: "parking",
      label: "주차 안내",
      value: academy.location.parking,
      ok: academy.location.parking.trim().length > 0,
      severity: "recommended",
      message: "방문 상담이 있는 학원은 주차 가능 여부를 안내하는 편이 좋습니다."
    }
  ];
}

function summarizeChecks(checks: ContentCheck[], severity: ContentCheck["severity"]) {
  const scopedChecks = checks.filter((check) => check.severity === severity);
  const missing = scopedChecks.filter((check) => !check.ok).map((check) => check.label);

  return {
    total: scopedChecks.length,
    passed: scopedChecks.length - missing.length,
    missing
  };
}

function formatMissingItems(items: string[]) {
  if (items.length === 0) {
    return "";
  }

  const preview = items.slice(0, 3).join(", ");
  return items.length > 3 ? `${preview} 외 ${items.length - 3}개` : preview;
}

export function getContentReadiness(checks: ContentCheck[]): ContentReadiness {
  const required = summarizeChecks(checks, "required");
  const recommended = summarizeChecks(checks, "recommended");
  const passedCount = checks.filter((check) => check.ok).length;
  const score = checks.length === 0 ? 0 : Math.round((passedCount / checks.length) * 100);

  if (required.missing.length > 0) {
    return {
      status: "NEEDS_REQUIRED",
      label: "필수 자료 부족",
      summary: `MATERIALS_READY 전환 전 필수 자료 ${required.missing.length}개를 보강해야 합니다.`,
      score,
      required,
      recommended,
      nextAction: `고객에게 ${formatMissingItems(required.missing)} 자료를 먼저 요청합니다.`
    };
  }

  if (recommended.missing.length > 0) {
    return {
      status: "NEEDS_RECOMMENDED",
      label: "제작 가능 · 권장 보강",
      summary: `필수 자료는 준비됐고 권장 자료 ${recommended.missing.length}개를 보강하면 품질이 좋아집니다.`,
      score,
      required,
      recommended,
      nextAction: `초안 제작은 가능하며, ${formatMissingItems(recommended.missing)} 보강을 권장합니다.`
    };
  }

  return {
    status: "READY",
    label: "제작 준비 완료",
    summary: "필수 자료와 권장 자료가 모두 준비되어 초안 제작과 내부 검수로 진행할 수 있습니다.",
    score,
    required,
    recommended,
    nextAction: "MATERIALS_READY 이후 초안 제작과 내부 검수로 진행합니다."
  };
}

export function getAcademyContentReview(
  academy: AcademySite,
  options: AcademyContentCheckOptions = {}
): ContentReviewResult {
  const checks = getAcademyContentChecks(academy, options);
  return {
    checks,
    readiness: getContentReadiness(checks)
  };
}

function collectAcademySeedErrors(value: unknown, path: string): string[] {
  const errors: string[] = [];

  if (!isObject(value)) {
    return [`${path} must be an object.`];
  }

  for (const field of ["id", "academyId", "slug", "name", "tagline", "summary", "heroImage"]) {
    requireString(value, field, path, errors);
  }

  if (!allowedTemplateIds.includes(value.templateId as TemplateId)) {
    errors.push(`${path}.templateId must be one of: ${allowedTemplateIds.join(", ")}.`);
  }

  if (!allowedProductionStatuses.includes(value.productionStatus as ProductionStatus)) {
    errors.push(`${path}.productionStatus must be one of: ${allowedProductionStatuses.join(", ")}.`);
  }

  if (!isObject(value.publication)) {
    errors.push(`${path}.publication must be an object.`);
  } else {
    if (!allowedPublicationModes.includes(value.publication.mode as PublicationMode)) {
      errors.push(`${path}.publication.mode must be one of: ${allowedPublicationModes.join(", ")}.`);
    }

    for (const field of ["sampleDisclosureVisible", "customerApprovedForPublish", "heroAssetApproved"]) {
      if (!isBoolean(value.publication[field])) {
        errors.push(`${path}.publication.${field} must be a boolean.`);
      }
    }

    if (value.publication.footerNote !== undefined && !isNonEmptyString(value.publication.footerNote)) {
      errors.push(`${path}.publication.footerNote must be a non-empty string when provided.`);
    }
  }

  if (!isNonEmptyStringArray(value.subjects)) {
    errors.push(`${path}.subjects must be a non-empty string array.`);
  }

  if (!isNonEmptyStringArray(value.targetGrades)) {
    errors.push(`${path}.targetGrades must be a non-empty string array.`);
  }

  requireObjectArray(value.strengths, ["title", "body"], `${path}.strengths`, errors, { minLength: 3 });
  requireStringFields(value.introduction, ["philosophy", "operation", "management"], `${path}.introduction`, errors);
  requireObjectArray(value.teachers, ["name", "role", "grades", "focus", "note"], `${path}.teachers`, errors, {
    minLength: 1
  });
  requireObjectArray(value.curriculum, ["title", "grades", "goal", "method"], `${path}.curriculum`, errors, {
    minLength: 1
  });
  requireObjectArray(value.schedules, ["day", "time", "grade", "subject", "className"], `${path}.schedules`, errors, {
    minLength: 1
  });
  requireObjectArray(value.notices, ["id", "title", "date", "body"], `${path}.notices`, errors, {
    booleanFields: ["pinned", "visible"]
  });
  requireStringFields(value.location, ["address", "phone", "hours", "transit", "parking"], `${path}.location`, errors);
  requireStringFields(value.consultation, ["description", "availableTime"], `${path}.consultation`, errors);
  requireStringFields(value.links, ["payment", "academyAdmin", "examAdmin"], `${path}.links`, errors);

  return errors;
}

export function validateAcademySeedList(raw: unknown, sourceDescription: string): AcademySite[] {
  if (!Array.isArray(raw)) {
    throw new Error(`Invalid academy content seed file: ${sourceDescription}\n- root must be an array.`);
  }

  const errors = raw.flatMap((item, index) => collectAcademySeedErrors(item, `academies[${index}]`));

  if (errors.length > 0) {
    throw new Error(`Invalid academy content seed file: ${sourceDescription}\n- ${errors.join("\n- ")}`);
  }

  return raw as AcademySite[];
}
