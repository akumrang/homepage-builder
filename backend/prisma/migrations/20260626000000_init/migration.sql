-- CreateTable
CREATE TABLE "Inquiry" (
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
);

-- CreateTable
CREATE TABLE "Notice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "academySlug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HomepageSiteState" (
  "slug" TEXT NOT NULL PRIMARY KEY,
  "homepageId" TEXT NOT NULL,
  "academyId" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "productionStatus" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Inquiry_academySlug_idx" ON "Inquiry"("academySlug");

-- CreateIndex
CREATE INDEX "Inquiry_createdAt_idx" ON "Inquiry"("createdAt");

-- CreateIndex
CREATE INDEX "Notice_academySlug_idx" ON "Notice"("academySlug");

-- CreateIndex
CREATE INDEX "Notice_date_idx" ON "Notice"("date");
