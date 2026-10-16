import { getOneTargetRenderPlan } from '@src/domain.operations/review/getOneTargetRenderPlan';

/**
 * .what = the named inputs a target's sent bytes land in, in wire order
 * .why = each is a different lever, so every surface that sizes the targets names
 *        them apart:
 *        - `targetFiles` — the bodies of EDITED files. a narrower bind shrinks it
 *        - `targetDiffs.additions` — the bodies of ADDED files. a narrower bind or a
 *          declared partition (`--partition`) shrinks it
 *        - `targetDiffs.deletions` — a path apiece. never the cause of an overflow
 *        - `targetDiffs.mutations` — the hunks of edited files. a narrower bind shrinks it
 *        (rule.require.distinguish-every-review-input)
 */
export const NAMES_OF_TARGET_INPUT = [
  'targetFiles',
  'targetDiffs.additions',
  'targetDiffs.deletions',
  'targetDiffs.mutations',
] as const;
export type TargetInputName = (typeof NAMES_OF_TARGET_INPUT)[number];

/**
 * .what = splits the targets a prompt would send into its named target inputs
 * .why = one combined mass answers "which directory is big" and never "big with
 *        WHAT" — and the answer decides the lever the overflow refusal names
 *        (`asReviewOverflowLeverLines`).
 *
 * .note = the send decision is read from `getOneTargetRenderPlan`, the same plan the
 *         combined breakdown reads, so no list can hold a body or diff the renderer
 *         drops. a deletion is listed with an empty body: it counts as a target and
 *         carries no chars
 */
export const asTargetContentsByInput = (input: {
  targets: {
    path: string;
    content: string | null;
    diff?: string | null;
    changeKind?: 'new' | 'edited' | 'deleted';
  }[];
  focus: 'pull' | 'push';
}): Record<TargetInputName, { path: string; content: string }[]> => {
  const planned = input.targets.map((target) => ({
    target,
    plan: getOneTargetRenderPlan({ target, focus: input.focus }),
  }));
  const diffsOf = (kind: 'new' | 'edited' | 'deleted') =>
    planned.filter(
      ({ plan, target }) =>
        plan.sendsDiff && (target.changeKind ?? 'edited') === kind,
    );
  return {
    // gate on presence, never truthiness: an empty edited file still sends its block
    // (`isTargetFileSent` reads `content !== null`), so it keeps its row
    targetFiles: planned.flatMap(({ plan, target }) =>
      plan.sendsFile && target.content !== null
        ? [{ path: target.path, content: target.content }]
        : [],
    ),
    'targetDiffs.additions': diffsOf('new').map(({ target }) => ({
      path: target.path,
      content: target.content ?? '',
    })),
    'targetDiffs.deletions': diffsOf('deleted').map(({ target }) => ({
      path: target.path,
      content: '',
    })),
    'targetDiffs.mutations': diffsOf('edited').map(({ target }) => ({
      path: target.path,
      content: target.diff ?? '',
    })),
  };
};
