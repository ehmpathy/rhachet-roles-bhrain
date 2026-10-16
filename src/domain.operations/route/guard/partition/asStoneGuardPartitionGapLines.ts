// a sanctioned exposure, declared in src/domain.operations/review/partition/.readme.md
import {
  asReviewPartitionRepairLines,
  asReviewPartitionRepairTipLines,
} from '@src/domain.operations/review/partition/asReviewPartitionRepairLines';
import { asCountedNoun } from '@src/utils/asCountedNoun';

import { asRouteGuardPartitionScopeLabel } from './asRouteGuardPartitionScopeLabel';
import type { StoneGuardPartitionGap } from './StoneGuardPartitionGap';

/**
 * .what = the refusal's tree for one scope: what it lacks, where the repair puts it, and
 *         the command that writes it
 */
const asLinesOfGap = (input: {
  gap: StoneGuardPartitionGap;
  isLast: boolean;
}): string[] => {
  const branch = input.isLast ? '└─' : '├─';
  const indent = input.isLast ? '      ' : '   │  ';
  const repairLines = asReviewPartitionRepairLines({
    repair: { placed: input.gap.placed, command: input.gap.command },
    indent,
    caption: 'repair — run this, then re-arrive',
  });
  const unclaimed = repairLines.placed;
  const routeAbsent = input.gap.routeAbsentFrom.map(
    (slug, index) =>
      `${indent}│  ${index === input.gap.routeAbsentFrom.length - 1 ? '└─' : '├─'} ${slug} (+ the route spec)`,
  );
  return [
    `   ${branch} scope ${asRouteGuardPartitionScopeLabel({ scope: input.gap.scope })}`,
    ...(unclaimed.length > 0
      ? [
          `${indent}├─ ${asCountedNoun({ count: unclaimed.length, one: 'changed file sits', many: 'changed files sit' })} in no partition`,
          ...unclaimed,
        ]
      : []),
    ...(routeAbsent.length > 0
      ? [
          `${indent}├─ ${asCountedNoun({ count: routeAbsent.length, one: 'partition lacks', many: 'partitions lack' })} the route spec`,
          ...routeAbsent,
        ]
      : []),
    ...repairLines.command,
  ];
};

/**
 * .what = the stdout a stone prints when its route partitions cannot hold the branch
 * .why = 🔴 the refusal carries the whole fix: each gap, where the repair places each file,
 *        and the one command that writes it. a driver reads it once and runs one line — no
 *        set re-typed by hand, no lane spent to learn of the gap (rule.forbid.workarounds)
 *
 * 🔴 the copy is context-free. two surfaces print it — the entrance gate, as it refuses a
 *    round, and the route.drive replay (onBoot, onStop, a direct drive) long after. a headline
 *    that said "at the entrance" and "no lane was run" narrated a moment the replay reader is
 *    not in, so it now states what holds on every surface: the stone, and that no lane runs
 *    until the partitions cover the branch (r014 nitpick.2, i014)
 */
export const asStoneGuardPartitionGapLines = (input: {
  stone: string;
  gaps: StoneGuardPartitionGap[];
}): string[] => [
  '🦉 the partitions would leave changed files unreviewed — no lane runs until they cover them',
  '',
  `🗿 route.guard.partition, on stone ${input.stone}`,
  ...input.gaps.flatMap((gap, index) =>
    asLinesOfGap({ gap, isLast: index === input.gaps.length - 1 }),
  ),
  // the tip rides once, after the whole tree, so a paste of a repair never carries it
  ...(input.gaps.length > 0 ? asReviewPartitionRepairTipLines() : []),
];
