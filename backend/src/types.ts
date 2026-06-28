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

export type PublicationMode = "SAMPLE" | "CUSTOMER_PREVIEW" | "CUSTOMER_PUBLISHED";

export type PublicationAssetSource =
  | "SAMPLE"
  | "CUSTOMER_PROVIDED"
  | "MUKSAN_CREATED"
  | "MUKSAN_APPROVED_REPLACEMENT";

export interface PublicationLogoAssetPolicy {
  assetId?: string;
  source: PublicationAssetSource;
  approvedForPublish: boolean;
  textFallbackApproved: boolean;
}

export interface PublicationHeroAssetPolicy {
  assetId?: string;
  source: PublicationAssetSource;
  approvedForPublish: boolean;
}

export interface AcademyPublicationAssets {
  logo: PublicationLogoAssetPolicy;
  hero: PublicationHeroAssetPolicy;
}

export interface AcademyPublicationPolicy {
  mode: PublicationMode;
  sampleDisclosureVisible: boolean;
  customerApprovedForPublish: boolean;
  assets: AcademyPublicationAssets;
  footerNote?: string;
}

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
  publication: AcademyPublicationPolicy;
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
  intakeField?: string;
  missingAction?: string;
}

export type ContentReadinessStatus = "READY" | "NEEDS_RECOMMENDED" | "NEEDS_REQUIRED";

export interface ContentReadinessMissingItem {
  key: string;
  label: string;
  intakeField: string;
  action: string;
}

export interface ContentReadinessMaterialGate {
  targetStatus: "MATERIALS_READY";
  canTransition: boolean;
  label: string;
  message: string;
  blockingItems: ContentReadinessMissingItem[];
}

export interface ContentReadiness {
  status: ContentReadinessStatus;
  label: string;
  summary: string;
  score: number;
  required: {
    total: number;
    passed: number;
    missing: string[];
    missingItems: ContentReadinessMissingItem[];
  };
  recommended: {
    total: number;
    passed: number;
    missing: string[];
    missingItems: ContentReadinessMissingItem[];
  };
  materialGate: ContentReadinessMaterialGate;
  nextAction: string;
}

export interface ContentReviewResult {
  checks: ContentCheck[];
  readiness: ContentReadiness;
}
