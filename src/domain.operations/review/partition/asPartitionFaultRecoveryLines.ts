import { asErrorHeadline } from '@src/domain.operations/review/asErrorHeadline';
import { ReviewOverflowRefusedError } from '@src/domain.operations/review/ReviewOverflowRefusedError';

import type { PartitionFaultKind } from './asPartitionFaultKind';

/**
 * .what = the recovery lines a partition fault's kind earns
 * .why = a re-run for a transient fault; the refusal's own fix for a constraint; a repair for
 *        a malfunction. each names the move the caller can actually make
 *
 * 🔴 .note = the move depends on WHO ran the review. a route run is re-run by a re-arrive, and
 *         its partition set lives on the route's guard (`rhx route.guard.partition`). a hand
 *         run (`rhx review --partition ...`, no route bound) has neither: a re-arrive and a
 *         guard command are dead ends there, so it is told to run the review again and to
 *         narrow the `--partition` flags on its own command (rule.require.errors-name-the-fix)
 */
export const asPartitionFaultRecoveryLines = (input: {
  kind: PartitionFaultKind;
  error: unknown;
  /** the route this run was driven from; null for a hand run */
  route: string | null;
}): string[] => {
  // how this run is run again: a re-arrive on a route, the command itself by hand
  const isRouteRun = input.route !== null;
  const rerun = isRouteRun ? 're-arrive' : 'run the review again';

  // a transient fault clears on a re-run
  if (input.kind === 'transient')
    return [
      'every other partition kept its verdict above and below. the fault is transient, so',
      isRouteRun ? 're-arrive to re-run this lane.' : 'run the review again.',
    ];

  // a malfunction of the review itself repeats on a re-run, so name it and its repair
  if (input.kind === 'malfunction')
    return [
      'every other partition kept its verdict above and below. this fault is a malfunction of',
      `the review itself, not a transient one, so a ${isRouteRun ? 're-arrive' : 're-run'} alone will not fix it.`,
      `fix: repair what raised \`${asErrorHeadline({ error: input.error })}\`, then ${rerun}.`,
    ];

  // a constraint repeats on a re-run, so name the fix its refusal names
  const isLaneWide = input.kind === 'constraint.lane-wide';
  const subject = isLaneWide
    ? [
        'every partition of this lane refused on this same constraint, so the lane returned',
        'no verdict at all. a re-run returns the same refusal — it cannot help.',
      ]
    : [
        'every other partition kept its verdict above and below. this fault is a constraint,',
        'so a re-run returns the same refusal — it cannot help.',
      ];
  if (!(input.error instanceof ReviewOverflowRefusedError))
    return [
      ...subject,
      `fix: clear what the refusal on stderr names, then ${rerun}.`,
    ];

  // an overflow is cured by a narrower set, declared where this run reads its set from
  const narrow = isLaneWide
    ? 'fix: narrow each partition, or split each in two — the refusal on stderr names'
    : 'fix: narrow this partition, or split it in two — the refusal on stderr names';
  const declare = isRouteRun
    ? "the locus. declare the new set, then re-arrive: rhx route.guard.partition --for review --peer @all --partition '<slug>=<globs>' --mode apply"
    : 'the locus. narrow the --partition declarations on this review line, then run it again.';
  return [...subject, narrow, declare];
};
