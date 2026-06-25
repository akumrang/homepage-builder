import cors from "cors";
import express from "express";
import type { Server } from "node:http";
import { pathToFileURL } from "node:url";
import { getAcademyContentChecks } from "./contentValidation.js";
import { academySites, findAcademyBySlug } from "./sampleAcademies.js";
import {
  ensureHomepageStateStore,
  getHomepageState,
  listAcademySummaries,
  updateHomepageProductionStatus,
  validateProductionStatusInput,
  withProductionState
} from "./homepageStateStore.js";
import {
  createNotice,
  deleteNotice,
  ensureNoticeStore,
  listInternalNotices,
  listPublicNotices,
  updateNotice,
  validateNoticeInput
} from "./noticeStore.js";
import {
  createInquiry,
  ensureInquiryStore,
  listInquiries,
  updateInquiryStatus,
  validateInquiryInput,
  validateInquiryStatusInput
} from "./inquiryStore.js";
import type { InquiryInput, InquiryStatusInput, NoticeInput, ProductionStatusInput } from "./types.js";

export const app = express();
const port = Number(process.env.PORT ?? 4200);

app.use(
  cors({
    origin: ["http://localhost:5175", "http://127.0.0.1:5175"],
    credentials: false
  })
);
app.use(express.json({ limit: "64kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "muksan-homepage-backend" });
});

app.get("/api/academies", async (_req, res, next) => {
  try {
    res.json({ academies: await listAcademySummaries() });
  } catch (error) {
    next(error);
  }
});

app.get("/api/academies/:slug", async (req, res, next) => {
  try {
    const academy = findAcademyBySlug(req.params.slug);

    if (!academy) {
      res.status(404).json({ message: "학원 홈페이지를 찾을 수 없습니다." });
      return;
    }

    const state = await getHomepageState(academy.slug);
    const academyWithState = withProductionState(academy, state);

    res.json({
      academy: {
        ...academyWithState,
        notices: await listPublicNotices(academy.slug)
      }
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/academies/:slug/status", async (req, res, next) => {
  try {
    const academy = findAcademyBySlug(req.params.slug);

    if (!academy) {
      res.status(404).json({ message: "상태를 변경할 학원 정보를 찾을 수 없습니다." });
      return;
    }

    const input = req.body as Partial<ProductionStatusInput>;
    const errors = validateProductionStatusInput(input);

    if (errors.length > 0) {
      res.status(400).json({ message: "홈페이지 제작 상태 입력값을 확인해 주세요.", errors });
      return;
    }

    const updatedAcademy = await updateHomepageProductionStatus(
      academy,
      input.productionStatus as ProductionStatusInput["productionStatus"]
    );

    res.json({
      academy: {
        id: updatedAcademy.id,
        academyId: updatedAcademy.academyId,
        slug: updatedAcademy.slug,
        name: updatedAcademy.name,
        templateId: updatedAcademy.templateId,
        productionStatus: updatedAcademy.productionStatus
      }
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/academies/:slug/content-checks", async (req, res, next) => {
  try {
    const academy = findAcademyBySlug(req.params.slug);

    if (!academy) {
      res.status(404).json({ message: "콘텐츠를 점검할 학원 정보를 찾을 수 없습니다." });
      return;
    }

    const publicNotices = await listPublicNotices(academy.slug);
    res.json({ checks: getAcademyContentChecks(academy, { visibleNoticeCount: publicNotices.length }) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/academies/:slug/notices", async (req, res, next) => {
  try {
    const academy = findAcademyBySlug(req.params.slug);

    if (!academy) {
      res.status(404).json({ message: "공지사항을 조회할 학원 정보를 찾을 수 없습니다." });
      return;
    }

    res.json({ notices: await listInternalNotices(academy.slug) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/academies/:slug/notices", async (req, res, next) => {
  try {
    const academy = findAcademyBySlug(req.params.slug);

    if (!academy) {
      res.status(404).json({ message: "공지사항을 등록할 학원 정보를 찾을 수 없습니다." });
      return;
    }

    const input = req.body as Partial<NoticeInput>;
    const errors = validateNoticeInput(input);

    if (errors.length > 0) {
      res.status(400).json({ message: "공지사항 입력값을 확인해 주세요.", errors });
      return;
    }

    const notice = await createNotice(academy.slug, input as NoticeInput);
    res.status(201).json({ notice });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/notices/:id", async (req, res, next) => {
  try {
    const input = req.body as Partial<NoticeInput>;
    const errors = validateNoticeInput(input);

    if (errors.length > 0) {
      res.status(400).json({ message: "공지사항 입력값을 확인해 주세요.", errors });
      return;
    }

    const notice = await updateNotice(req.params.id, input as NoticeInput);

    if (!notice) {
      res.status(404).json({ message: "공지사항을 찾을 수 없습니다." });
      return;
    }

    res.json({ notice });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/notices/:id", async (req, res, next) => {
  try {
    const deleted = await deleteNotice(req.params.id);

    if (!deleted) {
      res.status(404).json({ message: "공지사항을 찾을 수 없습니다." });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get("/api/inquiries", async (_req, res, next) => {
  try {
    res.json({ inquiries: await listInquiries() });
  } catch (error) {
    next(error);
  }
});

app.post("/api/inquiries", async (req, res, next) => {
  try {
    const input = req.body as Partial<InquiryInput>;
    const errors = validateInquiryInput(input);

    if (errors.length > 0) {
      res.status(400).json({ message: "상담 문의 입력값을 확인해 주세요.", errors });
      return;
    }

    const academy = findAcademyBySlug(input.academySlug ?? "");
    if (!academy) {
      res.status(404).json({ message: "상담을 접수할 학원 정보를 찾을 수 없습니다." });
      return;
    }

    const inquiry = await createInquiry(input as InquiryInput);
    res.status(201).json({
      inquiry,
      message: "상담 신청이 접수되었습니다. 학원에서 확인 후 연락드리겠습니다."
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/inquiries/:id/status", async (req, res, next) => {
  try {
    const input = req.body as Partial<InquiryStatusInput>;
    const errors = validateInquiryStatusInput(input);

    if (errors.length > 0) {
      res.status(400).json({ message: "상담 문의 상태 입력값을 확인해 주세요.", errors });
      return;
    }

    const inquiry = await updateInquiryStatus(req.params.id, input.status as InquiryStatusInput["status"]);

    if (!inquiry) {
      res.status(404).json({ message: "상담 문의를 찾을 수 없습니다." });
      return;
    }

    res.json({ inquiry });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ message: "서버에서 요청을 처리하지 못했습니다." });
});

export async function initializeStores(): Promise<void> {
  await ensureHomepageStateStore();
  await ensureInquiryStore();
  await ensureNoticeStore();
}

export async function startServer(listenPort = port): Promise<Server> {
  await initializeStores();

  return app.listen(listenPort, () => {
    console.log(`Muksan homepage backend is running on http://localhost:${listenPort}`);
  });
}

function isMainModule(): boolean {
  return process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;
}

if (isMainModule()) {
  try {
    await startServer();
  } catch (error) {
    console.error("Failed to initialize backend stores.", error);
    process.exit(1);
  }
}
