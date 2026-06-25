import type { Notice as PrismaNotice } from "@prisma/client";
import { academySites } from "./sampleAcademies.js";
import { prisma } from "./prismaClient.js";
import type { NoticeInput, NoticeItem } from "./types.js";

function toNoticeItem(record: PrismaNotice): NoticeItem {
  return {
    id: record.id,
    academySlug: record.academySlug,
    title: record.title,
    date: record.date,
    body: record.body,
    pinned: record.pinned,
    visible: record.visible
  };
}

export async function ensureNoticeStore(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Notice" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "academySlug" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "date" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "pinned" BOOLEAN NOT NULL DEFAULT false,
      "visible" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Notice_academySlug_idx" ON "Notice"("academySlug")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Notice_date_idx" ON "Notice"("date")`);

  await seedSampleNotices();
}

async function seedSampleNotices(): Promise<void> {
  for (const academy of academySites) {
    for (const notice of academy.notices) {
      const existing = await prisma.notice.findUnique({
        where: { id: notice.id }
      });

      if (!existing) {
        await prisma.notice.create({
          data: {
            id: notice.id,
            academySlug: academy.slug,
            title: notice.title,
            date: notice.date,
            body: notice.body,
            pinned: notice.pinned,
            visible: notice.visible
          }
        });
      }
    }
  }
}

export async function listPublicNotices(academySlug: string): Promise<NoticeItem[]> {
  const records = await prisma.notice.findMany({
    where: {
      academySlug,
      visible: true
    },
    orderBy: [{ pinned: "desc" }, { date: "desc" }, { createdAt: "desc" }]
  });

  return records.map(toNoticeItem);
}

export async function listInternalNotices(academySlug: string): Promise<NoticeItem[]> {
  const records = await prisma.notice.findMany({
    where: {
      academySlug
    },
    orderBy: [{ pinned: "desc" }, { date: "desc" }, { createdAt: "desc" }]
  });

  return records.map(toNoticeItem);
}

export function validateNoticeInput(input: Partial<NoticeInput>): string[] {
  const errors: string[] = [];

  if (!input.title?.trim()) errors.push("공지 제목을 입력해 주세요.");
  if (!input.date?.trim()) errors.push("공지 날짜를 입력해 주세요.");
  if (input.date && !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.push("공지 날짜는 YYYY-MM-DD 형식이어야 합니다.");
  }
  if (!input.body?.trim()) errors.push("공지 내용을 입력해 주세요.");
  if (typeof input.pinned !== "boolean") errors.push("중요 공지 여부를 선택해 주세요.");
  if (typeof input.visible !== "boolean") errors.push("공개 여부를 선택해 주세요.");

  return errors;
}

export async function createNotice(academySlug: string, input: NoticeInput): Promise<NoticeItem> {
  const record = await prisma.notice.create({
    data: {
      id: `notice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      academySlug,
      title: input.title.trim(),
      date: input.date.trim(),
      body: input.body.trim(),
      pinned: input.pinned,
      visible: input.visible
    }
  });

  return toNoticeItem(record);
}

export async function updateNotice(id: string, input: NoticeInput): Promise<NoticeItem | null> {
  const existing = await prisma.notice.findUnique({
    where: { id }
  });

  if (!existing) {
    return null;
  }

  const record = await prisma.notice.update({
    where: { id },
    data: {
      title: input.title.trim(),
      date: input.date.trim(),
      body: input.body.trim(),
      pinned: input.pinned,
      visible: input.visible
    }
  });

  return toNoticeItem(record);
}

export async function deleteNotice(id: string): Promise<boolean> {
  const existing = await prisma.notice.findUnique({
    where: { id }
  });

  if (!existing) {
    return false;
  }

  await prisma.notice.delete({
    where: { id }
  });

  return true;
}
