import { PROVENANCE_LABELS, type Provenance } from "@/lib/types";

const STYLES: Record<Provenance, string> = {
  "verified-native": "bg-ok-soft text-ok",
  "verified-community": "bg-info-soft text-info",
  "ai-adapted": "bg-warn-soft text-warn",
  "ai-generated": "bg-paper text-muted border border-line",
  "user-submitted": "bg-paper text-muted border border-line-strong",
};

export function ProvenanceBadge({
  provenance,
  note,
}: {
  provenance: Provenance;
  note?: string;
}) {
  const meta = PROVENANCE_LABELS[provenance];
  const verified = provenance.startsWith("verified");
  return (
    <span
      title={note ? `${meta.detail} Reviewer: ${note}` : meta.detail}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[provenance]}`}
    >
      <span aria-hidden>{verified ? "✓" : "◌"}</span>
      {meta.title}
    </span>
  );
}
