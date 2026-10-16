import type {
  ReviewGroveProgress,
  ReviewGroveStage,
} from '@src/domain.operations/review/grove/genReviewGroveReport';

/**
 * .what = what each stage did, in the past tense
 * .why = a Record over the stage union, never a switch with a default. the Record
 *        goes RED when a fourth stage joins `ReviewGroveStage`, where a switch with
 *        a fallback would render the new stage as whatever the fallback says and
 *        nobody would see it (rule.forbid.inline-decode-friction)
 *
 * .note = past tense on purpose. every event is emitted AFTER its work, so it
 *         reports a fact. a present-tense line would claim work that may yet fail
 */
const VERB_OF_STAGE: Record<ReviewGroveStage, string> = {
  walk: 'walked',
  mine: 'mined',
  fold: 'folded',
};

/**
 * .what = the branch glyph each stage renders under
 * .why = `fold` is the LAST stage by construction, so it closes the treestruct. a
 *        streamed render cannot look ahead to know which line is last, so the fact
 *        is carried by the stage rather than by a lookahead it cannot have
 *        (rule.require.treestruct-output)
 */
const BRANCH_OF_STAGE: Record<ReviewGroveStage, string> = {
  walk: '├─',
  mine: '├─',
  fold: '└─',
};

/**
 * .what = renders one grove-walk progress event as one line
 * .why = the grove walk reads every review log on the machine and took MINUTES with
 *        no output at all. a human cannot tell a silent wait from a hang, so they
 *        ctrl-c a healthy process — `rule.require.status-feedback` grades that a
 *        blocker, and `def.frictionless` names it as friction outright.
 *
 * .note = a LINE, never a spinner. a spinner needs a tty and a cursor rewrite, so
 *         it renders as garbage the moment the command is piped or run in ci. one
 *         line per measured stage works in every one of those, and the transcript it
 *         leaves behind is readable after the fact.
 *
 * .note = the counter renders ONLY where a total is known. `walk` and `fold` carry
 *         their count inside `detail`, so a `3/null` prefix would either lie or
 *         repeat them.
 */
export const genReviewGroveProgressLine = (input: {
  progress: ReviewGroveProgress;
}): string => {
  const { stage, done, total, detail } = input.progress;
  const counter = total === null ? '' : `${done}/${total} · `;
  return `   ${BRANCH_OF_STAGE[stage]} ${VERB_OF_STAGE[stage]} ${counter}${detail}`;
};
