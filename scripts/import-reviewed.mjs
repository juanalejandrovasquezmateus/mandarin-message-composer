// Imports reviewed CSV files from ./review into the phrase banks.
//   npm run import:reviewed
// Chinese:  review/phrases-to-review.csv  -> src/data/verified-phrases.json
// Spanish:  review/spanish-to-review.csv  -> src/data/verified-phrases-es.json
//
// decision column: "keep" -> verified with the AI line
//                  "fix"  -> verified with the reviewer's corrected line
//                  "reject" -> dropped
//                  empty  -> stays pending (never shown as verified)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { toPinyin } from "./lib/pinyin.mjs";

const ROOT = process.cwd();
const TODAY = new Date().toISOString().slice(0, 10);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((f) => f.trim() !== "")) rows.push(row);
  }
  return rows;
}

function toObjects(rows, file) {
  const header = rows[0].map((h) => h.trim().replace(/^﻿/, ""));
  const n = header.length;
  return rows.slice(1).map((r, idx) => {
    let cells = r;
    if (r.length > n) {
      // An unquoted comma inside the free-text column before the four review
      // columns. Stitch the overflow back together.
      const freeIdx = n - 5;
      const extra = r.length - n;
      cells = [
        ...r.slice(0, freeIdx),
        r.slice(freeIdx, freeIdx + extra + 1).join(","),
        ...r.slice(freeIdx + extra + 1),
      ];
      console.warn(`${file}: row ${idx + 2} had ${extra} extra comma(s); merged.`);
    }
    const o = {};
    header.forEach((h, i) => (o[h] = (cells[i] ?? "").trim()));
    return o;
  });
}

const STOP = new Set(
  (
    "a an the to for of on in at with from by someone their them they his her its is are be do after before during about new your my me you who whom when while into out up " +
    "not just only really might could would should want like have has had this that there these those what which some something anything i'll i'm it's that's let's"
  ).split(" "),
);
function stem(w) {
  let s = w.replace(/(izing|ising|ing|ed)$/u, "");
  if (/(shes|ches|xes|sses)$/u.test(s)) s = s.slice(0, -2);
  else if (/[^s]s$/u.test(s)) s = s.slice(0, -1);
  return s.slice(0, 10);
}
function keywordsFor(...texts) {
  const set = new Set();
  for (const t of texts) {
    for (const raw of t.toLowerCase().split(/[^a-z']+/)) {
      if (!raw || STOP.has(raw) || raw.length < 4) continue;
      const k = stem(raw);
      if (k.length >= 3) set.add(k);
    }
  }
  return [...set];
}

function verification(o) {
  const d = o.decision.toLowerCase();
  if (d === "reject") return null;
  const verified = d === "keep" || d === "fix";
  return {
    status: verified ? "verified" : "pending",
    level: "native",
    verifiedBy: verified ? o.reviewer_name : "",
    note: o.reviewer_note,
    date: verified ? TODAY : "",
  };
}

function importFile(csvPath, jsonPath, mapRow) {
  if (!existsSync(csvPath)) {
    console.log(`skip: ${path.relative(ROOT, csvPath)} not found`);
    return;
  }
  const rows = toObjects(parseCsv(readFileSync(csvPath, "utf8")), path.basename(csvPath));
  const existing = existsSync(jsonPath) ? JSON.parse(readFileSync(jsonPath, "utf8")) : [];
  const byId = new Map(existing.map((e) => [e.id, e]));
  const counts = { verified: 0, pending: 0, rejected: 0 };
  for (const o of rows) {
    const v = verification(o);
    if (!v) {
      counts.rejected++;
      byId.delete(`rev-${o.id}`);
      continue;
    }
    counts[v.status]++;
    const entry = mapRow(o, v);
    byId.set(entry.id, entry);
  }
  const out = [...byId.values()];
  writeFileSync(jsonPath, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(
    `${path.relative(ROOT, jsonPath)}: ${out.length} entries (this file: ${counts.verified} verified, ${counts.pending} pending, ${counts.rejected} rejected)`,
  );
}

importFile(
  path.join(ROOT, "review", "phrases-to-review.csv"),
  path.join(ROOT, "src", "data", "verified-phrases.json"),
  (o, v) => {
    const fixed = o.decision.toLowerCase() === "fix" && o.chinese_fixed;
    const chinese = fixed ? o.chinese_fixed : o.chinese_ai;
    return {
      id: `rev-${o.id}`,
      sourceLanguage: "en",
      targetLanguage: "zh-Hans",
      intent: o.situation,
      keywords: keywordsFor(o.situation, o.english_ai),
      relationship: o.relationship,
      tone: o.tone,
      context: o.context,
      region: o.region.toLowerCase(),
      chinese,
      // Pinyin always comes from the library, never from the CSV.
      pinyin: toPinyin(chinese),
      english: o.english_ai,
      nuance: o.reviewer_note || "",
      verification: v,
    };
  },
);

importFile(
  path.join(ROOT, "review", "spanish-to-review.csv"),
  path.join(ROOT, "src", "data", "verified-phrases-es.json"),
  (o, v) => {
    const fixed = o.decision.toLowerCase() === "fix" && o.spanish_fixed;
    return {
      id: `rev-${o.id}`,
      sourceLanguage: "en",
      targetLanguage: "es",
      intent: o.situation,
      keywords: keywordsFor(o.situation, o.english_ai),
      relationship: o.relationship,
      tone: o.tone,
      context: o.context,
      region: o.region.toLowerCase(),
      chinese: fixed ? o.spanish_fixed : o.spanish_ai,
      pinyin: "",
      english: o.english_ai,
      nuance: o.reviewer_note || "",
      verification: v,
    };
  },
);
