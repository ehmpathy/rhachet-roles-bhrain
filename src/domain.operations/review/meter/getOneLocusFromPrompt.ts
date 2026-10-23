import { asPromptSectionChars } from '@src/domain.operations/review/asPromptSectionChars';
import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';
import { getOneFileText } from '@src/domain.operations/review/getOneFileText';

/**
 * .what = the per-target locus, read from the rendered prompt
 * .why = the ONE source that can supply it. the compiled artifact records a row per
 *        named INPUT, so it can say `targetFiles is 74.7% of 1.1M chars` and cannot
 *        say which directory those chars came from. the rendered prompt carries each
 *        block's `path="…"`, so the same single-cursor walk that sums the rows also
 *        places their mass (rule.require.report-both-cost-levers-with-trend-and-locus).
 *
 * .note = `null` on an unreadable or absent prompt, so the caller's `locus` stays
 *         UNREAD rather than turn into an empty rollup. `[]` is reserved for a prompt
 *         that was read and genuinely had no per-target mass — a `--focus pull` run.
 */
export const getOneLocusFromPrompt = async (input: {
  dir: string;
}): Promise<{ path: string; chars: number }[] | null> => {
  const raw = await getOneFileText({
    at: asRunArtifactPath({ dir: input.dir, artifact: 'prompt' }),
  });
  if (raw === null) return null;
  return asPromptSectionChars({ prompt: raw })?.locus ?? null;
};
