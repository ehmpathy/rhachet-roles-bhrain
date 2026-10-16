import { asTargetDiffBody } from '@src/domain.operations/review/asTargetDiffBody';
import { getOneTargetRenderPlan } from '@src/domain.operations/review/getOneTargetRenderPlan';

/**
 * .what = the diff half of a target's fold — the body its diff block sends,
 *         set apart from a file half by one newline where both ride
 * .why = an edited target folds body plus hunks; an addition folds its body
 *        alone, so no lead newline is owed when no file half precedes it
 */
const asDiffPart = (input: {
  target: Parameters<typeof asTargetDiffBody>[0]['target'];
}): string => {
  const body = asTargetDiffBody({ target: input.target });
  if (!body) return '';
  return input.target.changeKind === 'new' ? body : `\n${body}`;
};

/**
 * .what = folds each target down to the bytes the renderer sends for it — its
 *         body and its diff, each only where the renderer actually carries it
 * .why = the token-breakdown estimate must measure what was sent, never what
 *        was held. a target's diff is read off disk for every target and
 *        dropped by the renderer for some of them, so an unconditional fold
 *        overstates those targets by roughly their whole body again — a diff
 *        is the body with a `+` per line under a preamble
 *        (rule.require.distinguish-every-review-input).
 *
 *        the decision is read from `getOneTargetRenderPlan` rather than
 *        restated, so no call site can drift from it. `focus` is a required
 *        input rather than an optional one, since a call site that dropped
 *        it would count every body the renderer never sent under
 *        `--focus pull`.
 *
 * .note = a deleted target's content is `null` and counts as empty — it renders as
 *         a lone void tag, so it contributes no bytes and must not contribute a
 *         literal `"null"` either. the plan answers `sendsFile: false` for it.
 */
export const asTargetContentsForBreakdown = (input: {
  targets: {
    path: string;
    content: string | null;
    diff?: string | null;
    changeKind?: 'new' | 'edited' | 'deleted';
  }[];
  focus: 'pull' | 'push';
}): { path: string; content: string }[] =>
  input.targets.map((target) => {
    const plan = getOneTargetRenderPlan({ target, focus: input.focus });

    return {
      path: target.path,
      content: [
        plan.sendsFile ? (target.content ?? '') : '',
        plan.sendsDiff ? asDiffPart({ target }) : '',
      ].join(''),
    };
  });
