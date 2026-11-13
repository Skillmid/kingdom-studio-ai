/**
 * Field-level review of an AI Story Bible proposal.
 *
 * Creator values are authoritative: a proposed value only fills a field that is empty, unless the
 * creator explicitly selects that field to replace their current value. Nothing here saves; the
 * result is applied to the editable form and the creator still saves manually.
 */

export type ProposalFieldStatus = "fill" | "conflict" | "same";

export interface ProposalFieldReview {
  key: string;
  proposed: string | number;
  current: string | number | undefined;
  status: ProposalFieldStatus;
}

type FormValues = Record<string, string | number>;

function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === "";
}

function sameValue(a: unknown, b: unknown): boolean {
  return String(a ?? "").trim() === String(b ?? "").trim();
}

/** Reviewable proposal fields that exist on the form, with whether they fill, conflict or match. */
export function reviewProposalFields(form: object, proposal: Record<string, unknown>): ProposalFieldReview[] {
  const current = form as FormValues;
  const reviews: ProposalFieldReview[] = [];
  for (const [key, raw] of Object.entries(proposal)) {
    if (!(key in current) || isEmptyValue(raw)) continue;
    if (typeof raw !== "string" && typeof raw !== "number") continue;
    const existing = current[key];
    const status: ProposalFieldStatus = isEmptyValue(existing)
      ? "fill"
      : sameValue(existing, raw)
        ? "same"
        : "conflict";
    reviews.push({ key, proposed: raw, current: existing, status });
  }
  return reviews;
}

/** Default selection: only fields that are currently empty. Conflicts need an explicit choice. */
export function defaultProposalSelection(reviews: ProposalFieldReview[]): Set<string> {
  return new Set(reviews.filter((review) => review.status === "fill").map((review) => review.key));
}

/**
 * Effective selection = explicit creator choices layered over the default (empty fields only).
 * Computed against the live form, so a field the creator fills while the proposal is open
 * stops being pre-selected.
 */
export function effectiveProposalSelection(
  reviews: ProposalFieldReview[],
  choices: Readonly<Record<string, boolean>>,
): Set<string> {
  const selected = defaultProposalSelection(reviews);
  for (const review of reviews) {
    const choice = choices[review.key];
    if (choice === true) selected.add(review.key);
    if (choice === false) selected.delete(review.key);
  }
  return selected;
}

/** Applies only the selected fields; unselected, unchanged and unknown fields are left alone. */
export function applySelectedProposalFields<T extends object>(
  form: T,
  proposal: Record<string, unknown>,
  selected: ReadonlySet<string>,
): T {
  const current = form as FormValues;
  const next: FormValues = { ...current };
  for (const review of reviewProposalFields(current, proposal)) {
    if (review.status === "same" || !selected.has(review.key)) continue;
    const existing = current[review.key];
    // Keep the form's value type (e.g. duration_minutes stays a number).
    if (typeof existing === "number") {
      const numeric = Number(review.proposed);
      if (!Number.isFinite(numeric)) continue;
      next[review.key] = numeric;
    } else {
      next[review.key] = String(review.proposed);
    }
  }
  return next as unknown as T;
}
