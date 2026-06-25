import type { AcademySite, ContentCheck, ProductionStatus, TemplateId } from "./types.js";

const allowedTemplateIds: TemplateId[] = ["trust-basic-v1"];
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
    }
  ];
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
