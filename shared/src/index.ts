export const INQUIRY_MESSAGE_MIN_LENGTH = 10;

export interface InquiryValidationInput {
  academySlug?: string;
  parentName?: string;
  phone?: string;
  studentGrade?: string;
  subject?: string;
  message?: string;
  privacyAccepted?: boolean;
}

export type InquiryValidationField = keyof InquiryValidationInput;
export type InquiryValidationErrors = Partial<Record<InquiryValidationField, string>>;

export function isValidMobilePhone(value: string) {
  const digitsOnly = value.replace(/[^\d]/g, "");
  return /^01[016789]\d{7,8}$/.test(digitsOnly);
}

export function validateInquiryFields(input: InquiryValidationInput): InquiryValidationErrors {
  const errors: InquiryValidationErrors = {};

  if (!input.academySlug?.trim()) {
    errors.academySlug = "학원 정보가 없습니다.";
  }

  if (!input.parentName?.trim()) {
    errors.parentName = "보호자 이름을 입력해 주세요.";
  }

  if (!input.phone?.trim()) {
    errors.phone = "연락처를 입력해 주세요.";
  } else if (!isValidMobilePhone(input.phone)) {
    errors.phone = "휴대전화 번호를 010-0000-0000 형식 또는 숫자만 입력해 주세요.";
  }

  if (!input.studentGrade?.trim()) {
    errors.studentGrade = "학생 학년을 선택해 주세요.";
  }

  if (!input.subject?.trim()) {
    errors.subject = "관심 과목을 선택해 주세요.";
  }

  if (!input.message?.trim()) {
    errors.message = "문의 내용을 입력해 주세요.";
  } else if (input.message.trim().length < INQUIRY_MESSAGE_MIN_LENGTH) {
    errors.message = `문의 내용은 ${INQUIRY_MESSAGE_MIN_LENGTH}자 이상 입력해 주세요.`;
  }

  if (input.privacyAccepted !== true) {
    errors.privacyAccepted = "개인정보 수집·이용 동의가 필요합니다.";
  }

  return errors;
}

export function listInquiryValidationMessages(input: InquiryValidationInput): string[] {
  return Object.values(validateInquiryFields(input)).filter((message): message is string => Boolean(message));
}
