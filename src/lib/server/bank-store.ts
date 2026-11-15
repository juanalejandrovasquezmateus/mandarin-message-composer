// Server-only: reads and writes the phrase bank and the review queue as JSON
// files under src/data. This works on any host with a writable disk (local
// demo, a VPS). On a read-only serverless host writes will fail; a hosted
// store would replace this module.
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ReviewRequestItem, VerifiedPhrase } from "../types";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const BANK_FILE = path.join(DATA_DIR, "verified-phrases.json");
const QUEUE_FILE = path.join(DATA_DIR, "review-queue.json");

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

export const readBank = () => readJson<VerifiedPhrase[]>(BANK_FILE, []);
export const writeBank = (entries: VerifiedPhrase[]) => writeJson(BANK_FILE, entries);

export const readQueue = () => readJson<ReviewRequestItem[]>(QUEUE_FILE, []);
export const writeQueue = (items: ReviewRequestItem[]) => writeJson(QUEUE_FILE, items);

export async function appendToBank(entry: VerifiedPhrase) {
  const bank = await readBank();
  const idx = bank.findIndex((e) => e.id === entry.id);
  if (idx >= 0) bank[idx] = entry;
  else bank.push(entry);
  await writeBank(bank);
}

export async function removeFromQueue(id: string) {
  const queue = await readQueue();
  await writeQueue(queue.filter((q) => q.id !== id));
}
