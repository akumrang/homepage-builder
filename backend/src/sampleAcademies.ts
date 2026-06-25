import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AcademySite } from "./types.js";
import { validateAcademySeedList } from "./contentValidation.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const contentPath = path.resolve(currentDir, "../content/sample-academies.json");

function loadAcademySites(): AcademySite[] {
  const raw = JSON.parse(readFileSync(contentPath, "utf8")) as unknown;
  return validateAcademySeedList(raw, contentPath);
}

export const academySites: AcademySite[] = loadAcademySites();

export function findAcademyBySlug(slug: string): AcademySite | undefined {
  return academySites.find((academy) => academy.slug === slug);
}
