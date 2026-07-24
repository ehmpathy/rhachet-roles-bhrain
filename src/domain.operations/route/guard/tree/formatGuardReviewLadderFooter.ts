import type { ReviewPeerVerdict } from '../review/peer/meter/computeReviewPeerVerdict';
import type {
  ReviewPeerLadderLevelTerminal,
  ReviewPeerLadderStatus,
} from '../review/peer/meter/getReviewPeerLadderStatus';

/**
 * the verdict glyphs the footer can show. only DEFERRABLE terminal verdicts ever reach the
 * footer (status.unlockTransition gates out malfunction/constraint), so exhausted (🌙) is the
 * only glyph — approved carries none. malfunction (💥) / constraint (✋) never render here; their
 * halt shows its own remedy block instead (see getReviewPeerLadderStatus.unlockTransition).
 */
const VERDICT_GLYPH: Partial<Record<ReviewPeerVerdict, string>> = {
  exhausted: ' 🌙',
};

/**
 * .what = the label for a terminal level's line, e.g. "l1 is terminal (exhausted 🌙)"
 * .why = names WHY the level no longer blocks, with the same glyph the reviewer line above
 *        carries, so a driver reads the footer and the tree as one consistent story
 */
const asTerminalLevelLabel = (level: ReviewPeerLadderLevelTerminal): string => {
  const glyph = VERDICT_GLYPH[level.verdict] ?? '';
  return `l${level.level} is terminal (${level.verdict}${glyph}) — it no longer blocks you`;
};

/** the header glyph — a lotus for the way that opens, set apart as a calm hint */
const FOOTER_HEADER = '🪷 the path continues';

/**
 * .what = renders the "path continues" hint — a STANDALONE block (own 🪷 header) that the
 *         vision's day-in-the-life mockup shows beneath the guard tree
 * .why = the wish's headline UX deliverable: when a lower level goes terminal (INCLUDING by
 *        exhaustion) and a higher level is now the live gate, the driver must be told plainly
 *        that the lower level no longer blocks, WHICH level has engaged, the exact command to
 *        re-drive, and that a human is only needed once every level is terminal. the
 *        per-reviewer `terminal — does not block higher levels` line kills the "it is all
 *        halted" misread at the reviewer; this hint answers the next question — "so where do i
 *        go now?" — at the ladder level. it stands APART from the `🗿 route.stone.set` tree (its
 *        own header, peer to the tree) so the driver reads it as guidance, not guard metadata.
 * .note = derived entirely from the ladder status (a read of the SAME peerMeters the tree
 *         renders), so the hint can never drift from the reviewer lines
 *         (rule.require.single-source-of-truth-for-render).
 * .note = shown ONLY at the unlock transition — a lower level terminal AND a HIGHER level now
 *         live (status.unlockTransition). when every level is terminal there is no live gate to
 *         point at, so the halt's own "options" block (overrule / budget / approve) carries the
 *         human guidance instead; and when the live gate sits below every terminal level (a
 *         regression state, e.g. a higher level approved via overrule while the base re-rejects)
 *         there is no upward unlock to narrate, so the hint stays silent.
 */
export const formatGuardReviewLadderFooter = (input: {
  stone: string;
  status: ReviewPeerLadderStatus;
}): string[] => {
  // render only at a true upward unlock — a lower level terminal beneath a higher live gate.
  // silent otherwise: all-terminal (halt options guide instead) or a regression state where
  // the live gate sits below every terminal level (no upward unlock to narrate).
  if (!input.status.unlockTransition) return [];

  // build the ordered child groups: each terminal level, then the live level (+ its
  // re-drive command), then the human-backstop reminder
  const groups: Array<{ label: string; cmd: string | null }> = [];
  for (const terminal of input.status.terminalLevels)
    groups.push({ label: asTerminalLevelLabel(terminal), cmd: null });
  groups.push({
    label: `l${input.status.liveLevel} has engaged — address its blockers, then:`,
    cmd: `rhx route.stone.set --stone ${input.stone} --as arrived`,
  });
  groups.push({
    label: `a human is only needed once every level is terminal`,
    cmd: null,
  });

  // render as a standalone top-level block: the 🪷 header, then box-draw children at the
  // same 3-space indent the other top-level blocks (🗿 route.stone.set) use
  const lines: string[] = [FOOTER_HEADER];
  groups.forEach((group, i) => {
    const isLast = i === groups.length - 1;
    const connector = isLast ? '└─' : '├─';
    lines.push(`   ${connector} ${group.label}`);
    if (group.cmd !== null) {
      const cmdIndent = isLast ? '   ' : '│  ';
      lines.push(`   ${cmdIndent}└─ ${group.cmd}`);
    }
  });
  return lines;
};
