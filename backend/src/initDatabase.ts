import { ensureInquiryStore } from "./inquiryStore.js";
import { ensureNoticeStore } from "./noticeStore.js";
import { ensureHomepageStateStore } from "./homepageStateStore.js";
import { prisma } from "./prismaClient.js";

try {
  await ensureHomepageStateStore();
  await ensureInquiryStore();
  await ensureNoticeStore();
  console.log("Prisma SQLite stores are ready.");
} finally {
  await prisma.$disconnect();
}
