import type { HomepageSiteState } from "@prisma/client";
import { academySites } from "./sampleAcademies.js";
import { prisma } from "./prismaClient.js";
import type { AcademySite, ProductionStatus, ProductionStatusInput } from "./types.js";

export const productionStatuses: ProductionStatus[] = [
  "REQUESTED",
  "WAITING_FOR_MATERIALS",
  "MATERIALS_READY",
  "DRAFT_CREATED",
  "INTERNAL_REVIEW",
  "CUSTOMER_REVIEW",
  "APPROVED",
  "PUBLISHED"
];

export async function ensureHomepageStateStore(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "HomepageSiteState" (
      "slug" TEXT NOT NULL PRIMARY KEY,
      "homepageId" TEXT NOT NULL,
      "academyId" TEXT NOT NULL,
      "templateId" TEXT NOT NULL,
      "productionStatus" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await seedHomepageStates();
}

async function seedHomepageStates(): Promise<void> {
  for (const academy of academySites) {
    const existing = await prisma.homepageSiteState.findUnique({
      where: { slug: academy.slug }
    });

    if (!existing) {
      await prisma.homepageSiteState.create({
        data: {
          slug: academy.slug,
          homepageId: academy.id,
          academyId: academy.academyId,
          templateId: academy.templateId,
          productionStatus: academy.productionStatus
        }
      });
    }
  }
}

function normalizeProductionStatus(status: string): ProductionStatus {
  return productionStatuses.includes(status as ProductionStatus) ? (status as ProductionStatus) : "REQUESTED";
}

export function withProductionState(academy: AcademySite, state: HomepageSiteState | null): AcademySite {
  return {
    ...academy,
    productionStatus: normalizeProductionStatus(state?.productionStatus ?? academy.productionStatus)
  };
}

export async function getHomepageState(slug: string): Promise<HomepageSiteState | null> {
  return prisma.homepageSiteState.findUnique({
    where: { slug }
  });
}

export async function listAcademySummaries() {
  const states = await prisma.homepageSiteState.findMany();
  const stateBySlug = new Map(states.map((state) => [state.slug, state]));

  return academySites.map((academy) => {
    const academyWithState = withProductionState(academy, stateBySlug.get(academy.slug) ?? null);

    return {
      id: academyWithState.id,
      academyId: academyWithState.academyId,
      slug: academyWithState.slug,
      name: academyWithState.name,
      templateId: academyWithState.templateId,
      productionStatus: academyWithState.productionStatus
    };
  });
}

export function validateProductionStatusInput(input: Partial<ProductionStatusInput>): string[] {
  const errors: string[] = [];

  if (!input.productionStatus || !productionStatuses.includes(input.productionStatus)) {
    errors.push("홈페이지 제작 상태를 확인해 주세요.");
  }

  return errors;
}

export async function updateHomepageProductionStatus(
  academy: AcademySite,
  productionStatus: ProductionStatus
): Promise<AcademySite> {
  const state = await prisma.homepageSiteState.upsert({
    where: { slug: academy.slug },
    create: {
      slug: academy.slug,
      homepageId: academy.id,
      academyId: academy.academyId,
      templateId: academy.templateId,
      productionStatus
    },
    update: {
      productionStatus
    }
  });

  return withProductionState(academy, state);
}
