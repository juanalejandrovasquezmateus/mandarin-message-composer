// Warms the server cache with the demo intents so the stage demo is instant.
// Start the server first (npm run dev, or npm run build && npm start), then:
//   node scripts/prewarm.mjs            (defaults to http://localhost:3000)
//   node scripts/prewarm.mjs http://localhost:3000
// The cache lives in the server process: re-run after every server restart.
const base = process.argv[2] || "http://localhost:3000";

const DEMO_INTENTS = [
  { intent: "Can you save me a seat? I'm almost there", relationship: "classmate", tone: "casual" },
  { intent: "Ask my host mom if I can invite a friend over for dinner on Saturday", relationship: "family", tone: "polite" },
  { intent: "I want to thank my friend for helping me with homework, but not sound too formal", relationship: "friend", tone: "casual" },
  { intent: "Apologize to my teacher for sending the assignment late", relationship: "teacher", tone: "polite" },
  { intent: "Tell my host family's mom that dinner was delicious", relationship: "family", tone: "appreciative" },
];

async function post(path, body) {
  const r = await fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: r.status, data: await r.json().catch(() => null) };
}

for (const req of DEMO_INTENTS) {
  const t0 = Date.now();
  const { status, data } = await post("/api/compose", req);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (status !== 200) {
    console.log(`FAIL ${status} ${data?.error ?? ""}  "${req.intent}"`);
    continue;
  }
  const prov = data.result.candidates.map((c) => c.provenance[0]).join("");
  console.log(`ok ${secs}s ${data.cached ? "(cached)" : ""} [${prov}] "${req.intent}"`);
  // Also warm the meaning check for the candidate most likely to be clicked.
  for (const c of data.result.candidates.slice(0, 2)) {
    const t1 = Date.now();
    const v = await post("/api/verify", {
      chinese: c.chinese,
      intent: req.intent,
      relationship: req.relationship,
      tone: req.tone,
    });
    console.log(`   check ${v.status} ${((Date.now() - t1) / 1000).toFixed(1)}s ${v.data?.cached ? "(cached)" : ""}`);
  }
}
console.log("done. Keep this server process running until the demo.");
