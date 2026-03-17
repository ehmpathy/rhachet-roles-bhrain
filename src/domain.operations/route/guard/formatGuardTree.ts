/**
 * .what = formats guard results as a tree string with box-draw characters
 * .why = enables human-readable cli output for guard execution results
 */
export const formatGuardTree = (input: {
  stone: string;
  passage: 'allowed' | 'blocked' | 'malfunction';
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
  /**
   * .what = whether guard is the last item in the tree
   * .why = determines box-draw connector (└─ vs ├─) and inner indent
   */
  isLast?: boolean;
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
    if (
      (input.passage === 'blocked' || input.passage === 'malfunction') &&
      input.reason
    ) {
      lines.push(`   ├─ passage = ${passageLabel}`);
      lines.push(`   └─ reason = ${input.reason}`);
    } else {
      lines.push(`   └─ passage = ${passageLabel}`);
    }
    return lines.join('\n');
  }

  // emit passage line (not last — guard section follows)
  lines.push(`   ├─ passage = ${passageLabel}`);

  // emit reason if blocked or malfunction
  if (
    (input.passage === 'blocked' || input.passage === 'malfunction') &&
    input.reason
  ) {
    lines.push(`   ├─ reason = ${input.reason}`);
  }

  // guard section
  const hasReviews = input.guard.reviews.length > 0;
  const hasJudges = input.guard.judges.length > 0;

  // isLast determines connector and inner indent
  const guardIsLast = input.isLast ?? true;
  const guardConnector = guardIsLast ? '└─' : '├─';
  const guardIndent = guardIsLast ? '      ' : '   │  ';

  lines.push(`   ${guardConnector} guard`);

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
      lines.push(`${guardIndent}${sectionPrefix} artifacts`);
      for (let a = 0; a < input.guard.artifactFiles.length; a++) {
        const isArtifactLast = a === input.guard.artifactFiles.length - 1;
        const artPrefix = isArtifactLast ? '└─' : '├─';
        lines.push(
          `${guardIndent}${sectionIndent} ${artPrefix} ${input.guard.artifactFiles[a]}`,
        );
      }
    }

    if (section.type === 'reviews') {
      lines.push(`${guardIndent}${sectionPrefix} reviews`);
      for (let r = 0; r < input.guard.reviews.length; r++) {
        const review = input.guard.reviews[r]!;
        const isReviewLast = r === input.guard.reviews.length - 1;
        const reviewPrefix = isReviewLast ? '└─' : '├─';
        const reviewIndent = isReviewLast ? '   ' : '│  ';

        lines.push(
          `${guardIndent}${sectionIndent} ${reviewPrefix} r${review.index}: ${review.cmd}`,
        );

        if (review.cached) {
          lines.push(
            `${guardIndent}${sectionIndent} ${reviewIndent} └─ · cached`,
          );
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
              `${guardIndent}${sectionIndent} ${reviewIndent} ${detailPrefix} ${detailLines[d]}`,
            );
          }
        }
      }
    }

    if (section.type === 'judges') {
      lines.push(`${guardIndent}${sectionPrefix} judges`);
      for (let j = 0; j < input.guard.judges.length; j++) {
        const judge = input.guard.judges[j]!;
        const isJudgeLast = j === input.guard.judges.length - 1;
        const judgePrefix = isJudgeLast ? '└─' : '├─';
        const judgeIndent = isJudgeLast ? '   ' : '│  ';

        lines.push(
          `${guardIndent}${sectionIndent} ${judgePrefix} j${judge.index}: ${judge.cmd}`,
        );

        if (judge.cached) {
          lines.push(
            `${guardIndent}${sectionIndent} ${judgeIndent} └─ · cached`,
          );
        } else {
          const detailLines: string[] = [];
          const dur =
            judge.durationSec !== null
              ? `${judge.durationSec.toFixed(1)}s`
              : '0.0s';
          const mark = judge.passed ? '✓' : '✗';
          detailLines.push(`finished ${dur} ${mark}`);
          if (!judge.passed && judge.reason) {
            detailLines.push(`reason: ${judge.reason}`);
          }

          for (let d = 0; d < detailLines.length; d++) {
            const isDetailLast = d === detailLines.length - 1;
            const detailPrefix = isDetailLast ? '└─' : '├─';
            lines.push(
              `${guardIndent}${sectionIndent} ${judgeIndent} ${detailPrefix} ${detailLines[d]}`,
            );
          }
        }
      }
    }
  }

  return lines.join('\n');
};
