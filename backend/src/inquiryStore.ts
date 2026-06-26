import type { Inquiry as PrismaInquiry } from "@prisma/client";
import { listInquiryValidationMessages } from "@muksan-homepage/shared";
import { prisma } from "./prismaClient.js";
import type { Inquiry, InquiryInput, InquiryStatusInput } from "./types.js";

export async function ensureInquiryStore(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    await prisma.inquiry.count();
    return;
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Inquiry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "academySlug" TEXT NOT NULL,
      "parentName" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "studentGrade" TEXT NOT NULL,
      "subject" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "privacyAccepted" BOOLEAN NOT NULL DEFAULT true,
      "status" TEXT NOT NULL DEFAULT 'NEW',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Inquiry_academySlug_idx" ON "Inquiry"("academySlug")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Inquiry_createdAt_idx" ON "Inquiry"("createdAt")`);
}

function toInquiry(record: PrismaInquiry): Inquiry {
  return {
    id: record.id,
    academySlug: record.academySlug,
    parentName: record.parentName,
    phone: record.phone,
    studentGrade: record.studentGrade,
    subject: record.subject,
    message: record.message,
    privacyAccepted: true,
    status: record.status === "CHECKED" ? "CHECKED" : "NEW",
    createdAt: record.createdAt.toISOString()
  };
}

export async function listInquiries(): Promise<Inquiry[]> {
  const records = await prisma.inquiry.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  return records.map(toInquiry);
}

export function validateInquiryInput(input: Partial<InquiryInput>): string[] {
  return listInquiryValidationMessages(input);
}

export function validateInquiryStatusInput(input: Partial<InquiryStatusInput>): string[] {
  const errors: string[] = [];

  if (input.status !== "NEW" && input.status !== "CHECKED") {
    errors.push("상담 문의 상태는 NEW 또는 CHECKED만 사용할 수 있습니다.");
  }

  return errors;
}

export async function createInquiry(input: InquiryInput): Promise<Inquiry> {
  const record = await prisma.inquiry.create({
    data: {
      id: `inq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      academySlug: input.academySlug.trim(),
      parentName: input.parentName.trim(),
      phone: input.phone.trim(),
      studentGrade: input.studentGrade.trim(),
      subject: input.subject.trim(),
      message: input.message.trim(),
      privacyAccepted: true,
      status: "NEW"
    }
  });

  return toInquiry(record);
}

export async function updateInquiryStatus(id: string, status: Inquiry["status"]): Promise<Inquiry | null> {
  const existing = await prisma.inquiry.findUnique({
    where: { id }
  });

  if (!existing) {
    return null;
  }

  const record = await prisma.inquiry.update({
    where: { id },
    data: { status }
  });

  return toInquiry(record);
}
