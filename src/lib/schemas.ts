// Zod schemas: validate what the browser sends and what the model returns.
import { z } from "zod";
import { CONTEXT_MAX_CHARS, INTENT_MAX_CHARS } from "./types";

export const relationshipSchema = z.enum([
  "friend",
  "classmate",
  "family",
  "teacher",
]);
export const toneSchema = z.enum(["casual", "friendly", "polite", "appreciative"]);

export const composeRequestSchema = z.object({
  intent: z.string().trim().min(3).max(INTENT_MAX_CHARS),
  relationship: relationshipSchema,
  tone: toneSchema,
  context: z.string().trim().max(CONTEXT_MAX_CHARS).optional(),
});

export const verifyRequestSchema = z.object({
  chinese: z.string().trim().min(1).max(200),
  intent: z.string().trim().min(3).max(INTENT_MAX_CHARS),
  relationship: relationshipSchema,
  tone: toneSchema,
});

export const regionSchema = z.enum(["mainland", "taiwan", "other"]);

/** A line that claims to be Chinese must contain at least one Han character. */
const chineseLine = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .refine((s) => /\p{Script=Han}/u.test(s), "Not a Chinese line");

export const reviewRequestSchema = z.object({
  chinese: chineseLine,
  pinyin: z.string().trim().max(400).optional(),
  english: z.string().trim().max(300).optional(),
  /** "user" when the person typed their own wording. */
  source: z.enum(["ai", "user"]).optional(),
  intent: z.string().trim().min(3).max(INTENT_MAX_CHARS),
  relationship: relationshipSchema,
  tone: toneSchema,
  context: z.string().trim().max(CONTEXT_MAX_CHARS).optional(),
});

export const reviewDecideSchema = z.object({
  id: z.string().min(1).max(80),
  decision: z.enum(["keep", "fix", "reject"]),
  chineseFixed: chineseLine.optional(),
  note: z.string().trim().max(300).optional(),
  reviewerName: z.string().trim().min(1).max(60),
  tone: toneSchema.optional(),
  region: regionSchema.optional(),
  context: z.string().trim().max(CONTEXT_MAX_CHARS).optional(),
});

// --- Model output shapes -------------------------------------------------

export const screenSchema = z.object({
  isSimplifiedChinese: z.boolean(),
  appropriate: z.boolean(),
  sameMeaning: z.boolean(),
  reason: z.string(),
});

const vocabSchema = z.object({
  word: z.string(),
  pinyin: z.string(),
  meaning: z.string(),
});

const modelCandidateSchema = z.object({
  label: z.enum(["direct", "natural", "fitted"]),
  chinese: z.string(),
  pinyin: z.string(),
  english: z.string(),
  nuance: z.string(),
  vocab: z.array(vocabSchema),
  /** True when the model changed a verified phrase we gave it. */
  adaptedFromVerified: z.boolean(),
});

export const modelComposeSchema = z.object({
  candidates: z.array(modelCandidateSchema),
});
export type ModelCompose = z.infer<typeof modelComposeSchema>;

export const literalSchema = z.object({
  literalMeaning: z.string(),
  register: z.enum(["casual", "neutral", "polite", "formal"]),
});

export const gapSchema = z.object({
  gap: z.string(),
});
