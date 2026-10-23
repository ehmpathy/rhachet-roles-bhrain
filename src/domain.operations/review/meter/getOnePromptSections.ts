import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import type { ReviewRunMetricsCompiledRead } from '@src/domain.objects/Reviewer/ReviewRunMetricsCompiled';
import { asAttributionGrade } from '@src/domain.operations/review/asAttributionGrade';
import { asPromptSectionChars } from '@src/domain.operations/review/asPromptSectionChars';
import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';
import { getOneFileText } from '@src/domain.operations/review/getOneFileText';
import { asCompiledLocus } from '@src/domain.operations/review/meter/asCompiledLocus';
import { getOneLocusFromPrompt } from '@src/domain.operations/review/meter/getOneLocusFromPrompt';
import { getOnePromptSectionCharsFromCompiled } from '@src/domain.operations/review/meter/getOnePromptSectionCharsFromCompiled';
import { getOneRunArtifactJson } from '@src/domain.operations/review/meter/getOneRunArtifactJson';
import { getOneTargetCountFromCompiled } from '@src/domain.operations/review/meter/getOneTargetCountFromCompiled';

/**
 * .what = reads what a run's prompt was made of, by named input
 * .why = the durable artifact first, the re-parse only as a migration path.
 *        `metrics.compiled.json` is written at compile time from the source
 *        arrays — exact, kilobytes, free to read. the rendered prompt beside it
 *        runs to megabytes and must be re-parsed to recover the same figures.
 *
 *        measured: a grove mine that re-parsed every prompt read ~2.8gb and died
 *        at a 2gb heap limit. the same mine over the compiled artifacts reads
 *        kilobytes per run.
 *
 * .note = the parse remains because ~2,700 runs already on disk predate the
 *         artifact. it recovers a coarser row set, so the source rides with the
 *         figures and the census counts each provenance separately.
 */
export const getOnePromptSections = async (input: {
  dir: string;
  /**
   * also place the target mass by PATH where the compiled artifact cannot — a
   * read of the rendered prompt
   *
   * 🔴 .why = opt-in, and it must stay opt-in. a run compiled with the `locus` row
   *     carries it for free, at every breadth. a run compiled before that row
   *     existed can only be placed from the rendered prompt — a megabyte per run on
   *     this corpus. the `--of run` breadth reads ONE run and can afford it;
   *     `--of tree` builds a meter per run and would read 572 of them. so the
   *     breadth that can pay asks, and the breadth that cannot never does — it
   *     counts those runs unplaced instead.
   *
   * .note = a flag on the READ, never a second operation. the rows and the locus
   *         come off one walk of one artifact, so to split them would read the same
   *         megabyte twice and could let the two disagree
   *         (rule.forbid.duplicate-format-tree-operations).
   */
  withLocus: boolean;
}): Promise<ReviewRunMeter['prompt']> => {
  // .note = the `as` is the same boundary bind as `realizedRecord` in `getOneReviewRunMeter`: a file on
  //         disk is untrusted, so the cast carries only the field NAMES across it.
  //         the `typeof compiled.prompt?.chars` and `compiled.inputs` checks beneath
  //         are the gate, and the half a stricter validator would replace
  const compiled = (await getOneRunArtifactJson({
    dir: input.dir,
    artifact: 'compiled',
  })) as ReviewRunMetricsCompiledRead | null;

  if (compiled?.inputs && typeof compiled.prompt?.chars === 'number')
    return {
      chars: compiled.prompt.chars,
      // folded through a map over the whole input union, same reason as the
      // sections below. `targetFiles.count` alone is `0` under `--focus pull`,
      // where targets enter as paths — a hand-picked field read a pull run as
      // `N chars over 0 targets` and dropped it from the grove census
      targets: getOneTargetCountFromCompiled({ rows: compiled.inputs }),
      // read strictly; an unstated grade stays null. the ~2,700 runs already on
      // disk predate this field, so silence must not default to `attributed` —
      // that would mint a clean verdict nobody ever rendered
      attribution: asAttributionGrade({ value: compiled.prompt.attribution }),
      // folded through a map declared over the whole input union, never a
      // hand-written list of lookups — a list compiles fine while it drops the
      // ninth input somebody just added; the map goes red until that input
      // names the row it feeds (rule.require.distinguish-every-review-input)
      sections: getOnePromptSectionCharsFromCompiled({
        rows: compiled.inputs,
        chars: compiled.prompt.chars,
        dir: input.dir,
      }),
      source: 'compiled',
      // the compiled artifact carries the locus where it was written with one —
      // kilobytes, so every breadth may read it. a run compiled before the row
      // existed carries none, so a caller that WANTS a locus pays for a read of the
      // rendered prompt, here and only here — and a caller that does not gets
      // `null`, which is UNREAD and never `[]`. to flatten those two would report
      // "no directory carried mass" for a run whose directories were simply never
      // recorded (rule.forbid.failhide · hazard.a-status-read-cannot-report-absence)
      locus:
        asCompiledLocus({ value: compiled.locus, dir: input.dir }) ??
        (input.withLocus
          ? await getOneLocusFromPrompt({ dir: input.dir })
          : null),
    };

  const raw = await getOneFileText({
    at: asRunArtifactPath({ dir: input.dir, artifact: 'prompt' }),
  });
  if (raw === null) return null;

  const read = asPromptSectionChars({ prompt: raw });
  if (read === null) return null;

  return {
    chars: raw.length,
    targets: read.targets,
    sections: read.sections,
    source: 'parsed',
    // the writer's verdict was never in the rendered prompt, so the re-parse grades
    // its own residual by the same law — null only where the head carries no
    // markers to cut, so the census cannot part instructions from markup
    attribution: read.attribution,
    // the one source that CAN supply a locus: the rendered prompt carries each
    // block's `path="…"`, so the same single-cursor walk that sums the rows also
    // places their mass. `[]` here is a fact (a pull-focus prompt sends no payload)
    locus: read.locus,
  };
};
