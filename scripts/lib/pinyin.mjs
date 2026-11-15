// Node copy of src/lib/server/pinyin.ts for the scripts. Keep in step.
import { pinyin } from "pinyin-pro";

const PUNCT = [
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

export function toPinyin(text) {
  let s = pinyin(text, { nonZh: "consecutive" });
  for (const [re, rep] of PUNCT) s = s.replace(re, rep);
  s = s.replace(/\s+/g, " ").trim();
  return s.replace(/(^|[.?!]\s+)(\p{Ll})/gu, (_m, p, c) => p + c.toUpperCase());
}
