// Crude keyword extraction used to match a user's intent against bank entries.
// Mirrors scripts/import-reviewed.mjs; keep the two in step.
const STOP = new Set(
  (
    "a an the to for of on in at with from by someone their them they his her its is are be do after before during about new your my me you who whom when while into out up " +
    "not just only really might could would should want like have has had this that there these those what which some something anything i'll i'm it's that's let's"
  ).split(" "),
);

function stem(w: string) {
  let s = w.replace(/(izing|ising|ing|ed)$/u, "");
  if (/(shes|ches|xes|sses)$/u.test(s)) s = s.slice(0, -2);
  else if (/[^s]s$/u.test(s)) s = s.slice(0, -1);
  return s.slice(0, 10);
}

export function keywordsFor(...texts: string[]): string[] {
  const set = new Set<string>();
  for (const t of texts) {
    for (const raw of t.toLowerCase().split(/[^a-z']+/)) {
      if (!raw || STOP.has(raw) || raw.length < 4) continue;
      const k = stem(raw);
      if (k.length >= 3) set.add(k);
    }
  }
  return [...set];
}
