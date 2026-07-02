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

export default function InquiryForm({ academySlug }: { academySlug: string }) {
  const [form, setForm] = useState<InquiryInput>({ ...emptyForm, academySlug });
  const [errors, setErrors] = useState<InquiryValidationErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);

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
    setMessage(null);

    const nextErrors = validateInquiryFields({ ...form, academySlug });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      setMessage("입력값을 확인해 주세요. 표시된 항목을 수정해 주세요.");
      return;
    }

    setStatus("submitting");

    try {
      const result = await submitInquiry({ ...form, academySlug });
      setStatus("success");
      setMessage(result.message);
      setErrors({});
      setForm({ ...emptyForm, academySlug });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "상담 문의를 접수하지 못했습니다.");
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
          aria-invalid={Boolean(errors.privacyAccepted)}
          aria-describedby={errors.privacyAccepted ? "privacy-error" : undefined}
        />
        <span>상담 연락을 위해 입력한 개인정보를 수집·이용하는 데 동의합니다.</span>
      </label>
      {errors.privacyAccepted ? <small className="field-error" id="privacy-error">{errors.privacyAccepted}</small> : null}
      {message ? (
        <p
          className={status === "success" ? "form-message success" : "form-message error"}
          ref={messageRef}
          role={status === "success" ? "status" : "alert"}
          tabIndex={-1}
        >
          {message}
        </p>
      ) : null}
      <button className="button button-primary" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "접수 중" : "상담 문의 접수"}
      </button>
    </form>
  );
}
