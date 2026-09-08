import { TALLIED_FOOTER_PREFIX } from '../review/getReviewTacticFromContent';

/**
 * .what = formats the passage + tally footers of one artifact, with correct peer markers
 * .why = BOTH footers can fire on one artifact — a reviewer that exits non-zero and still
 *        renders a readable verdict earns a passage footer AND a tally. each was authored
 *        as though it were last, so each hardcoded `└─`, and the pair rendered two terminal
 *        branches at the root of one tree. a treestruct admits exactly one `└─` per level
 *        (`rule.require.treestruct-output`), so a driver who met a dual-outcome artifact read
 *        a shape no other artifact in the corpus produces
 *        (r6 ergo-snapshot-visual-blemishes, blocker.1, i019 — scoped re-run).
 *
 * .note = this is the twin of `formatArtifactStreamBuckets`, and for the identical reason:
 *         which footer lands LAST is one decision, so it lives in one operation rather than
 *         at two call sites that cannot see each other. that file omits an empty stream and
 *         computes the last-child marker together; this one emits the footers and computes
 *         the same marker together.
 *
 * .note = a `├─` parent carries `│  ` children and a `└─` parent carries `   ` children —
 *         the indent moves WITH the marker, so it is derived here rather than hardcoded.
 */
export const formatArtifactFooters = (input: {
  passage: null | {
    blockReason: string;
    exitCode: number;
    exitEmoji: string;
  };
  tally: null | {
    blockers: number;
    nitpicks: number;
    talliedBy: null | string;
  };
}): string[] => {
  const lines: string[] = [];

  // the passage footer closes the artifact only when no tally follows it
  if (input.passage) {
    const isLast = input.tally === null;
    const marker = isLast ? '└─' : '├─';
    const childIndent = isLast ? '   ' : '│  ';
    lines.push(`${marker} passage blocked`);
    lines.push(`${childIndent}├─ ${input.passage.blockReason}`);
    lines.push(
      `${childIndent}└─ exit code: ${input.passage.exitCode} ${input.passage.exitEmoji}`,
    );
  }

  // the tally footer is always last when present, so it always closes the artifact
  if (input.tally) {
    const blockerWord = input.tally.blockers === 1 ? 'blocker' : 'blockers';
    const nitpickWord = input.tally.nitpicks === 1 ? 'nitpick' : 'nitpicks';

    // a probabilistic tally appends a `tallied by reviewer@$brain` line, so the nitpicks row
    // becomes a mid-branch (├─); a deterministic tally ends on nitpicks (└─).
    const nitpicksBranch = input.tally.talliedBy ? '├─' : '└─';

    lines.push('└─ tallied');
    lines.push(`   ├─ ${input.tally.blockers} ${blockerWord}`);
    lines.push(`   ${nitpicksBranch} ${input.tally.nitpicks} ${nitpickWord}`);
    if (input.tally.talliedBy)
      lines.push(`   └─ ${TALLIED_FOOTER_PREFIX}${input.tally.talliedBy}`);
  }

  return lines;
};
