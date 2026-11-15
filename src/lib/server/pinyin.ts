// Deterministic pinyin from characters. Models make tone-mark mistakes;
// this never does (within the limits of the dictionary for 多音字).
import { pinyin } from "pinyin-pro";

const PUNCT: [RegExp, string][] = [
  [/\s*，\s*/g, ", "],
  [/\s*、\s*/g, ", "],
  [/\s*。\s*/g, ". "],
  [/\s*？\s*/g, "? "],
  [/\s*！\s*/g, "! "],
  [/\s*：\s*/g, ": "],
  [/\s*；\s*/g, "; "],
  [/\s*（\s*/g, " ("],
  [/\s*）\s*/g, ") "],
  [/\s*“\s*/g, ' "'],
  [/\s*”\s*/g, '" '],
  [/\s*～\s*/g, "~ "],
];

export function toPinyin(text: string): string {
  let s = pinyin(text, { nonZh: "consecutive" });
  for (const [re, rep] of PUNCT) s = s.replace(re, rep);
  s = s.replace(/\s+/g, " ").trim();
  // Capitalise the first letter of each sentence.
  return s.replace(/(^|[.?!]\s+)(\p{Ll})/gu, (_m, p: string, c: string) => p + c.toUpperCase());
}
