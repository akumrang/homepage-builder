import { isValidMobilePhone, listInquiryValidationMessages, validateInquiryFields } from "./index.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const validInquiry = {
  academySlug: "sample-korean-academy",
  parentName: "테스트 보호자",
  phone: "010-0000-0000",
  studentGrade: "중2",
  subject: "국어",
  message: "상담 가능한 시간을 확인하고 싶습니다.",
  privacyAccepted: true
};

function main() {
  assert(isValidMobilePhone("010-0000-0000"), "hyphenated mobile phone should be valid.");
  assert(isValidMobilePhone("01000000000"), "digits-only mobile phone should be valid.");
  assert(!isValidMobilePhone("02-123-4567"), "landline phone should be invalid.");

  const validErrors = validateInquiryFields(validInquiry);
  assert(Object.keys(validErrors).length === 0, `valid inquiry should not produce errors: ${JSON.stringify(validErrors)}`);

  const missingErrors = validateInquiryFields({
    academySlug: "",
    parentName: "",
    phone: "",
    studentGrade: "",
    subject: "",
    message: "",
    privacyAccepted: false
  });
  assert(missingErrors.academySlug?.includes("학원 정보"), "missing academy slug should be reported.");
  assert(missingErrors.parentName?.includes("보호자"), "missing parent name should be reported.");
  assert(missingErrors.phone?.includes("연락처"), "missing phone should be reported.");
  assert(missingErrors.studentGrade?.includes("학년"), "missing grade should be reported.");
  assert(missingErrors.subject?.includes("과목"), "missing subject should be reported.");
  assert(missingErrors.message?.includes("문의 내용"), "missing message should be reported.");
  assert(missingErrors.privacyAccepted?.includes("개인정보"), "missing privacy consent should be reported.");

  const invalidPhoneMessages = listInquiryValidationMessages({
    ...validInquiry,
    phone: "02-123-4567"
  });
  assert(
    invalidPhoneMessages.some((message) => message.includes("휴대전화")),
    "invalid phone should produce mobile phone format message."
  );

  const shortMessageErrors = validateInquiryFields({
    ...validInquiry,
    message: "짧음"
  });
  assert(shortMessageErrors.message?.includes("10자"), "short message should be reported.");

  console.log("[shared:smoke] passed: inquiry validation rules.");
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[shared:smoke] failed: ${message}`);
  process.exitCode = 1;
}
