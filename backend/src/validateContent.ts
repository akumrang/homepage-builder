import type { AcademySite, ContentCheck } from "./types.js";

function collectDuplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }

    seen.add(value);
  }

  return [...duplicates];
}

function addDuplicateErrors(errors: string[], academies: AcademySite[], field: "id" | "academyId" | "slug") {
  const duplicates = collectDuplicateValues(academies.map((academy) => academy[field]));

  for (const duplicate of duplicates) {
    errors.push(`Duplicate academy ${field}: ${duplicate}`);
  }
}

function formatFailedCheck(academy: AcademySite, check: ContentCheck): string {
  const value = check.value.trim() ? ` value="${check.value}"` : "";
  return `${academy.slug}: ${check.label} (${check.key})${value} - ${check.message}`;
}

async function main() {
  const [{ academySites }, { getAcademyContentChecks }] = await Promise.all([
    import("./sampleAcademies.js"),
    import("./contentValidation.js")
  ]);

  const errors: string[] = [];
  const warnings: string[] = [];
  let totalCheckCount = 0;

  if (academySites.length === 0) {
    errors.push("backend/content/sample-academies.json must include at least one academy.");
  }

  addDuplicateErrors(errors, academySites, "id");
  addDuplicateErrors(errors, academySites, "academyId");
  addDuplicateErrors(errors, academySites, "slug");

  for (const academy of academySites) {
    const checks = getAcademyContentChecks(academy);
    totalCheckCount += checks.length;

    for (const check of checks) {
      if (check.ok) continue;

      const target = check.severity === "required" ? errors : warnings;
      target.push(formatFailedCheck(academy, check));
    }
  }

  for (const warning of warnings) {
    console.warn(`[content:validate] warning: ${warning}`);
  }

  if (errors.length > 0) {
    console.error(`[content:validate] failed with ${errors.length} error(s):`);

    for (const error of errors) {
      console.error(`- ${error}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log(
    `[content:validate] passed: ${academySites.length} academy site(s), ${totalCheckCount} content check(s).`
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[content:validate] failed: ${message}`);
  process.exitCode = 1;
});
