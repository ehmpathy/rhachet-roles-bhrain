import type { ReviewerReflectManifestEntry } from '@src/domain.objects/Reviewer/ReviewerReflectManifest';

/**
 * .what = splits the bound entries into the entries themselves and the demotions among them
 * .why = the caller executes the entries and reports the demotions, two separate acts
 * .note = entry order is kept; a null demotion contributes no record
 */
export const asManifestEntriesAndDemotions = (input: {
  bound: {
    entry: ReviewerReflectManifestEntry;
    demotion: { path: string; targetPathStated: string | null } | null;
  }[];
}): {
  entries: ReviewerReflectManifestEntry[];
  demotions: { path: string; targetPathStated: string | null }[];
} => ({
  entries: input.bound.map((one) => one.entry),
  demotions: input.bound.flatMap((one) => (one.demotion ? [one.demotion] : [])),
});
