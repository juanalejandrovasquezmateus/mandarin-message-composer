// Regenerates pinyin for every Chinese entry in the bank from its characters.
//   node scripts/fill-pinyin.mjs
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { toPinyin } from "./lib/pinyin.mjs";

const file = path.join(process.cwd(), "src", "data", "verified-phrases.json");
const bank = JSON.parse(readFileSync(file, "utf8"));
let changed = 0;
for (const e of bank) {
  if (e.targetLanguage !== "zh-Hans") continue;
  const p = toPinyin(e.chinese);
  if (p !== e.pinyin) {
    e.pinyin = p;
    changed++;
  }
}
writeFileSync(file, JSON.stringify(bank, null, 2) + "\n", "utf8");
console.log(`pinyin regenerated for ${changed} of ${bank.length} entries`);
