/**
 * .what = formats guard results as a tree string with box-draw characters
 * .why = enables human-readable cli output for guard execution results
 */
export const formatGuardTree = (input: {
  stone: string;
  passage: 'allowed' | 'blocked';
  note: string | null;
  reason: string | null;
  guard: {
    artifactFiles: string[];
    reviews: Array<{
      index: number;
      cmd: string;
      cached: boolean;
      durationSec: number | null;
      blockers: number;
      nitpicks: number;
      path: string;
    }>;
    judges: Array<{
      index: number;
      cmd: string;
      cached: boolean;
      durationSec: number | null;
      passed: boolean;
      reason: string | null;
      path: string;
    }>;
  } | null;
}): string => {
  const lines: string[] = [];

  lines.push(`🗿 route.stone.set`);
  lines.push(`   ├─ stone = ${input.stone}`);

  // format passage line with optional note
  const passageLabel = input.note
    ? `${input.passage} (${input.note})`
    : input.passage;

  // if no guard, emit passage as the last line
  if (!input.guard) {
    if (input.passage === 'blocked' && input.reason) {
      lines.push(`   ├─ passage = ${passageLabel}`);
      lines.push(`   └─ reason = ${input.reason}`);
    } else {
      lines.push(`   └─ passage = ${passageLabel}`);
    }
    return lines.join('\n');
  }

  // emit passage line (not last — guard section follows)
  lines.push(`   ├─ passage = ${passageLabel}`);

  // emit reason if blocked
  if (input.passage === 'blocked' && input.reason) {
    lines.push(`   ├─ reason = ${input.reason}`);
  }

  // guard section
  const hasReviews = input.guard.reviews.length > 0;
  const hasJudges = input.guard.judges.length > 0;

  lines.push(`   └─ guard`);

  // determine which sub-sections are last for correct box-draw
  const sections: Array<{ type: 'artifacts' | 'reviews' | 'judges' }> = [];
  sections.push({ type: 'artifacts' });
  if (hasReviews) sections.push({ type: 'reviews' });
  if (hasJudges) sections.push({ type: 'judges' });

  for (let s = 0; s < sections.length; s++) {
    const section = sections[s]!;
    const isSectionLast = s === sections.length - 1;
    const sectionPrefix = isSectionLast ? '└─' : '├─';
    const sectionIndent = isSectionLast ? '   ' : '│  ';

    if (section.type === 'artifacts') {
      lines.push(`      ${sectionPrefix} artifacts`);
      for (let a = 0; a < input.guard.artifactFiles.length; a++) {
        const isArtifactLast = a === input.guard.artifactFiles.length - 1;
        const artPrefix = isArtifactLast ? '└─' : '├─';
        lines.push(
          `      ${sectionIndent} ${artPrefix} ${input.guard.artifactFiles[a]}`,
        );
      }
    }

    if (section.type === 'reviews') {
      lines.push(`      ${sectionPrefix} reviews`);
      for (let r = 0; r < input.guard.reviews.length; r++) {
        const review = input.guard.reviews[r]!;
        const isReviewLast = r === input.guard.reviews.length - 1;
        const reviewPrefix = isReviewLast ? '└─' : '├─';
        const reviewIndent = isReviewLast ? '   ' : '│  ';

        lines.push(
          `      ${sectionIndent} ${reviewPrefix} r${review.index}: ${review.cmd}`,
        );

        if (review.cached) {
          lines.push(`      ${sectionIndent} ${reviewIndent} └─ · cached`);
        } else {
          // build detail lines for fresh review
          const detailLines: string[] = [];
          const dur =
            review.durationSec !== null
              ? `${review.durationSec.toFixed(1)}s`
              : '0.0s';
          detailLines.push(`finished ${dur} ✓`);
          detailLines.push(`review: ${review.path}`);
          if (review.blockers > 0) {
            const label = review.blockers === 1 ? 'blocker' : 'blockers';
            detailLines.push(`${review.blockers} ${label} 🔴`);
          }
          if (review.nitpicks > 0) {
            const label = review.nitpicks === 1 ? 'nitpick' : 'nitpicks';
            detailLines.push(`${review.nitpicks} ${label} 🟠`);
          }

          for (let d = 0; d < detailLines.length; d++) {
            const isDetailLast = d === detailLines.length - 1;
            const detailPrefix = isDetailLast ? '└─' : '├─';
            lines.push(
              `      ${sectionIndent} ${reviewIndent} ${detailPrefix} ${detailLines[d]}`,
            );
          }
        }
      }
    }

    if (section.type === 'judges') {
      lines.push(`      ${sectionPrefix} judges`);
      for (let j = 0; j < input.guard.judges.length; j++) {
        const judge = input.guard.judges[j]!;
        const isJudgeLast = j === input.guard.judges.length - 1;
        const judgePrefix = isJudgeLast ? '└─' : '├─';
        const judgeIndent = isJudgeLast ? '   ' : '│  ';

        lines.push(
          `      ${sectionIndent} ${judgePrefix} j${judge.index}: ${judge.cmd}`,
        );

        if (judge.cached) {
          lines.push(`      ${sectionIndent} ${judgeIndent} └─ · cached`);
        } else {
          const detailLines: string[] = [];
          const dur =
            judge.durationSec !== null
              ? `${judge.durationSec.toFixed(1)}s`
              : '0.0s';
          const mark = judge.passed ? '✓' : '✗';
          detailLines.push(`finished ${dur} ${mark}`);
          detailLines.push(`judge: ${judge.path}`);
          if (!judge.passed && judge.reason) {
            detailLines.push(`reason: ${judge.reason}`);
          }

          for (let d = 0; d < detailLines.length; d++) {
            const isDetailLast = d === detailLines.length - 1;
            const detailPrefix = isDetailLast ? '└─' : '├─';
            lines.push(
              `      ${sectionIndent} ${judgeIndent} ${detailPrefix} ${detailLines[d]}`,
            );
          }
        }
      }
    }
  }

  return lines.join('\n');
};
