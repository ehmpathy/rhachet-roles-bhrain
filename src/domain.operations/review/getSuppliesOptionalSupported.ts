/**
 * .what = the single allow-list of supply names that `--optional` supports today
 * .why = one source of truth for "which supplies may skip-on-empty", shared by the CLI
 *        (`review.ts`, to reject unsupported names) and the domain op (`stepReview.ts`, for
 *        defense-in-depth). two hand-synced lists would drift — a supply added to one but not
 *        the other would silently mis-handle it. only `rules` is supported now; `refs` is a
 *        deliberate future extension (rejected loudly until built).
 * .note = declared `as const` so the runtime allow-list also drives the compile-time literal
 *         union `SupplyOptional` — add `'refs'` here and the type widens automatically, so every
 *         `SupplyOptional` call site is revisited by the compiler rather than by memory.
 */
export const SUPPLIES_OPTIONAL_SUPPORTED = ['rules'] as const;

/**
 * .what = the literal union of supply names `--optional` supports, derived from the allow-list
 * .why = one source drives both the runtime check and the compile-time type (no hand-synced union)
 */
export type SupplyOptional = (typeof SUPPLIES_OPTIONAL_SUPPORTED)[number];

/**
 * .what = whether a given supply name is one `--optional` supports today
 * .why = the shared membership check both layers use, so the allow-list has exactly one owner.
 *        a type guard, so callers that pass the check narrow `string` → `SupplyOptional`.
 */
export const isSupplyOptionalSupported = (
  supply: string,
): supply is SupplyOptional =>
  SUPPLIES_OPTIONAL_SUPPORTED.some((candidate) => candidate === supply);

/**
 * .what = returns the given supply names that `--optional` does not support today
 * .why = one shared transformer for "which of these names are unsupported", consumed by BOTH
 *        the CLI (`review.ts`, fail loud) and the domain op (`stepReview.ts`, defense-in-depth).
 *        lives here (domain.operations) — the common ancestor of both layers — so neither
 *        reimplements the filter (rule.prefer.most-common-denominator + rule.require.directional-deps:
 *        `stepReview` cannot import upward from `contract`, so a contract-layer home would force a
 *        duplicate).
 */
export const getSuppliesUnsupported = (input: {
  supplies: string[];
}): string[] =>
  input.supplies.filter((supply) => !isSupplyOptionalSupported(supply));
