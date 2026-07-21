import { type Change, diffLines } from 'diff';

/**
 * .what = a single line of a guard diff, tagged by how it changed
 * .why = a shared value shape consumed by getGuardDiff (producer) and
 *   formatGuardUpgradeTree (renderer) — kept as a domain shape so the renderer never
 *   touches the `diff` lib's `Change` type directly.
 */
export interface GuardDiffLine {
  kind: 'add' | 'remove' | 'context';
  text: string;
}

/**
 * .what = computes a per-line diff of the current guard vs the var-replayed template
 * .why = plan mode shows a unified `- old` / `+ new` view so a driver can review the
 *   change before it lands. wraps the battle-tested `diffLines` (pure JS, hermetic)
 *   rather than a correctness-subtle hand-rolled diff.
 */
export const getGuardDiff = (input: {
  current: string;
  next: string;
}): GuardDiffLine[] => {
  const changes: Change[] = diffLines(input.current, input.next);

  return changes.flatMap((change): GuardDiffLine[] => {
    const kind: GuardDiffLine['kind'] = change.added
      ? 'add'
      : change.removed
        ? 'remove'
        : 'context';

    // diffLines groups runs; each run's value holds one-or-more newline-joined lines
    // ended by a newline. split and drop the empty last element so we emit one entry
    // per line.
    const lines = change.value.split('\n');
    const lineTexts =
      lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines;
    return lineTexts.map((text) => ({ kind, text }));
  });
};
