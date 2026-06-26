export type TemplateId = "trust-basic-v1";

export type ProductionStatus =
  | "REQUESTED"
  | "WAITING_FOR_MATERIALS"
  | "MATERIALS_READY"
  | "DRAFT_CREATED"
  | "INTERNAL_REVIEW"
  | "CUSTOMER_REVIEW"
  | "APPROVED"
  | "PUBLISHED";

export interface TeacherProfile {
  name: string;
  role: string;
  grades: string;
  focus: string;
  note: string;
}

export interface CurriculumTrack {
  title: string;
  grades: string;
  goal: string;
  method: string;
}

export interface ClassSchedule {
  day: string;
  time: string;
  grade: string;
  subject: string;
  className: string;
}

export interface NoticeItem {
  id: string;
  academySlug?: string;
  title: string;
  date: string;
  body: string;
  pinned: boolean;
  visible: boolean;
}

export interface AcademySite {
  id: string;
  academyId: string;
  slug: string;
  templateId: TemplateId;
  productionStatus: ProductionStatus;
  name: string;
  tagline: string;
  summary: string;
  heroImage: string;
  subjects: string[];
  targetGrades: string[];
  strengths: Array<{ title: string; body: string }>;
  introduction: {
    philosophy: string;
    operation: string;
    management: string;
  };
  teachers: TeacherProfile[];
  curriculum: CurriculumTrack[];
  schedules: ClassSchedule[];
  notices: NoticeItem[];
  location: {
    address: string;
    phone: string;
    hours: string;
    transit: string;
    parking: string;
  };
  consultation: {
    description: string;
    availableTime: string;
  };
  links: {
    payment: string;
    academyAdmin: string;
    examAdmin: string;
  };
}

export interface AcademySummary {
  id: string;
  academyId: string;
  slug: string;
  name: string;
  templateId: TemplateId;
  productionStatus: ProductionStatus;
}

export interface Inquiry {
  id: string;
  academySlug: string;
  parentName: string;
  phone: string;
  studentGrade: string;
  subject: string;
  message: string;
  privacyAccepted: true;
  status: "NEW" | "CHECKED";
  createdAt: string;
}

export interface InquiryInput {
  academySlug: string;
  parentName: string;
  phone: string;
  studentGrade: string;
  subject: string;
  message: string;
  privacyAccepted: boolean;
}

export interface InquiryStatusInput {
  status: Inquiry["status"];
}

export interface NoticeInput {
  title: string;
  date: string;
  body: string;
  pinned: boolean;
  visible: boolean;
}

export interface ProductionStatusInput {
  productionStatus: ProductionStatus;
}

export interface ContentCheck {
  key: string;
  label: string;
  value: string;
  ok: boolean;
  severity: "required" | "recommended";
  message: string;
}

export type ContentReadinessStatus = "READY" | "NEEDS_RECOMMENDED" | "NEEDS_REQUIRED";

export interface ContentReadiness {
  status: ContentReadinessStatus;
  label: string;
  summary: string;
  score: number;
  required: {
    total: number;
    passed: number;
    missing: string[];
  };
  recommended: {
    total: number;
    passed: number;
    missing: string[];
  };
  nextAction: string;
}

export interface ContentReviewResult {
  checks: ContentCheck[];
  readiness: ContentReadiness;
}
