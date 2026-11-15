// Server-only: reads and writes the phrase banks (one file per target
// language) and the review queue as JSON files under src/data. This works on
// any host with a writable disk (local demo, a VPS). On a read-only serverless
// host writes will fail; a hosted store would replace this module.
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ReviewRequestItem, ReviewStatus, TargetLanguage, VerifiedPhrase } from "../types";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const BANK_FILES: Record<TargetLanguage, string> = {
  "zh-Hans": path.join(DATA_DIR, "verified-phrases.json"),
  es: path.join(DATA_DIR, "verified-phrases-es.json"),
};
const QUEUE_FILE = path.join(DATA_DIR, "review-queue.json");
const DECISIONS_FILE = path.join(DATA_DIR, "review-decisions.json");
const DECISIONS_MAX = 500;

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown) {
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2) + "\n", "utf8");
  await fs.rename(tmp, file);
}

export const readBank = (lang: TargetLanguage = "zh-Hans") =>
  readJson<VerifiedPhrase[]>(BANK_FILES[lang], []);
export const writeBank = (lang: TargetLanguage, entries: VerifiedPhrase[]) =>
  writeJson(BANK_FILES[lang], entries);

export async function readAllBanks(): Promise<VerifiedPhrase[]> {
  const parts = await Promise.all(
    (Object.keys(BANK_FILES) as TargetLanguage[]).map((l) => readBank(l)),
  );
  return parts.flat();
}

export const readQueue = () => readJson<ReviewRequestItem[]>(QUEUE_FILE, []);
export const writeQueue = (items: ReviewRequestItem[]) => writeJson(QUEUE_FILE, items);

export async function appendToBank(entry: VerifiedPhrase) {
  const lang: TargetLanguage = entry.targetLanguage === "es" ? "es" : "zh-Hans";
  const bank = await readBank(lang);
  const idx = bank.findIndex((e) => e.id === entry.id);
  if (idx >= 0) bank[idx] = entry;
  else bank.push(entry);
  await writeBank(lang, bank);
}

export const readDecisions = () => readJson<ReviewStatus[]>(DECISIONS_FILE, []);

/** Remembers the outcome of a request so the asking page can show it live. */
export async function recordDecision(d: ReviewStatus) {
  const all = (await readDecisions()).filter((x) => x.id !== d.id);
  all.push(d);
  await writeJson(DECISIONS_FILE, all.slice(-DECISIONS_MAX));
}

export async function removeFromQueue(id: string) {
  const queue = await readQueue();
  await writeQueue(queue.filter((q) => q.id !== id));
}
