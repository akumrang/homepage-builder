import { FormEvent, useEffect, useRef, useState } from "react";
import { validateInquiryFields, type InquiryValidationErrors } from "@muksan-homepage/shared";
import { submitInquiry } from "../api";
import type { InquiryInput } from "../types";

const emptyForm: InquiryInput = {
  academySlug: "",
  parentName: "",
  phone: "",
  studentGrade: "",
  subject: "",
  message: "",
  privacyAccepted: false
};

function createInquirySignature(input: InquiryInput): string {
  return JSON.stringify({
    academySlug: input.academySlug.trim(),
    parentName: input.parentName.trim(),
    phone: input.phone.replace(/[^\d]/g, ""),
    studentGrade: input.studentGrade.trim(),
    subject: input.subject.trim(),
    message: input.message.trim(),
    privacyAccepted: input.privacyAccepted
  });
}

export default function InquiryForm({ academySlug }: { academySlug: string }) {
  const [form, setForm] = useState<InquiryInput>({ ...emptyForm, academySlug });
  const [errors, setErrors] = useState<InquiryValidationErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);
  const isSubmitLockedRef = useRef(false);
  const lastSubmittedSignatureRef = useRef<string | null>(null);
  const isFormLocked = status === "submitting" || status === "success";
  const messageClassName =
    status === "success" ? "form-message success" : status === "submitting" ? "form-message info" : "form-message error";

  useEffect(() => {
    if ((status === "success" || status === "error") && message) {
      messageRef.current?.focus();
    }
  }, [message, status]);

  function clearFieldError(field: keyof InquiryInput) {
    setErrors((current) => ({ ...current, [field]: undefined }));

    if (status === "error") {
      setStatus("idle");
      setMessage(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitLockedRef.current || status === "success") {
      return;
    }

    setMessage(null);

    const payload = { ...form, academySlug };
    const nextErrors = validateInquiryFields(payload);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      setMessage("필수 항목과 개인정보 동의 여부를 확인해 주세요.");
      return;
    }

    const nextSignature = createInquirySignature(payload);

    if (lastSubmittedSignatureRef.current === nextSignature) {
      setStatus("success");
      setMessage("상담 신청이 이미 접수되었습니다. 학원에서 확인 후 연락드리겠습니다.");
      return;
    }

    isSubmitLockedRef.current = true;
    setStatus("submitting");
    setMessage("접수 중...");

    try {
      const result = await submitInquiry(payload);
      lastSubmittedSignatureRef.current = nextSignature;
      setStatus("success");
      setMessage(result.message || "상담 신청이 접수되었습니다. 학원에서 확인 후 연락드리겠습니다.");
      setErrors({});
    } catch {
      setStatus("error");
      setMessage("일시적인 오류로 접수되지 않았습니다. 잠시 후 다시 시도해 주세요.");
      lastSubmittedSignatureRef.current = null;
    } finally {
      isSubmitLockedRef.current = false;
    }
  }

  return (
    <form className="inquiry-form" onSubmit={handleSubmit} noValidate aria-busy={status === "submitting"}>
      <div className="field-grid">
        <label>
          <span>보호자 이름</span>
          <input
            value={form.parentName}
            onChange={(event) => {
              setForm((current) => ({ ...current, parentName: event.target.value }));
              clearFieldError("parentName");
            }}
            disabled={isFormLocked}
            required
            autoComplete="name"
            placeholder="예: 홍길동"
            aria-invalid={Boolean(errors.parentName)}
            aria-describedby={errors.parentName ? "parent-name-error" : undefined}
          />
          {errors.parentName ? <small className="field-error" id="parent-name-error">{errors.parentName}</small> : null}
        </label>
        <label>
          <span>연락처</span>
          <input
            value={form.phone}
            onChange={(event) => {
              setForm((current) => ({ ...current, phone: event.target.value }));
              clearFieldError("phone");
            }}
            disabled={isFormLocked}
            required
            autoComplete="tel"
            placeholder="예: 010-0000-0000"
            inputMode="tel"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone ? <small className="field-error" id="phone-error">{errors.phone}</small> : null}
        </label>
        <label>
          <span>학생 학년</span>
          <select
            value={form.studentGrade}
            onChange={(event) => {
              setForm((current) => ({ ...current, studentGrade: event.target.value }));
              clearFieldError("studentGrade");
            }}
            disabled={isFormLocked}
            required
            aria-invalid={Boolean(errors.studentGrade)}
            aria-describedby={errors.studentGrade ? "student-grade-error" : undefined}
          >
            <option value="">선택해 주세요</option>
            <option value="초5-초6">초5-초6</option>
            <option value="중1">중1</option>
            <option value="중2">중2</option>
            <option value="중3">중3</option>
            <option value="고1">고1</option>
          </select>
          {errors.studentGrade ? (
            <small className="field-error" id="student-grade-error">{errors.studentGrade}</small>
          ) : null}
        </label>
        <label>
          <span>관심 과목</span>
          <select
            value={form.subject}
            onChange={(event) => {
              setForm((current) => ({ ...current, subject: event.target.value }));
              clearFieldError("subject");
            }}
            disabled={isFormLocked}
            required
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? "subject-error" : undefined}
          >
            <option value="">선택해 주세요</option>
            <option value="국어">국어</option>
            <option value="독서">독서</option>
            <option value="문법">문법</option>
            <option value="서술형">서술형</option>
          </select>
          {errors.subject ? <small className="field-error" id="subject-error">{errors.subject}</small> : null}
        </label>
      </div>
      <label>
        <span>문의 내용</span>
        <textarea
          value={form.message}
          onChange={(event) => {
            setForm((current) => ({ ...current, message: event.target.value }));
            clearFieldError("message");
          }}
          disabled={isFormLocked}
          required
          minLength={10}
          rows={5}
          placeholder="상담을 원하는 학년, 현재 고민, 가능한 상담 시간을 남겨 주세요."
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message ? <small className="field-error" id="message-error">{errors.message}</small> : null}
      </label>
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={form.privacyAccepted}
          onChange={(event) => {
            setForm((current) => ({ ...current, privacyAccepted: event.target.checked }));
            clearFieldError("privacyAccepted");
          }}
          disabled={isFormLocked}
          aria-invalid={Boolean(errors.privacyAccepted)}
          aria-describedby={errors.privacyAccepted ? "privacy-error" : undefined}
        />
        <span>상담 연락을 위해 입력한 개인정보를 수집·이용하는 데 동의합니다.</span>
      </label>
      {errors.privacyAccepted ? <small className="field-error" id="privacy-error">{errors.privacyAccepted}</small> : null}
      {message ? (
        <p
          className={messageClassName}
          ref={messageRef}
          role={status === "success" || status === "submitting" ? "status" : "alert"}
          tabIndex={-1}
        >
          {message}
        </p>
      ) : null}
      <button className="button button-primary" type="submit" disabled={isFormLocked}>
        {status === "submitting" ? "접수 중..." : status === "success" ? "접수 완료" : "상담 문의 접수"}
      </button>
    </form>
  );
}
