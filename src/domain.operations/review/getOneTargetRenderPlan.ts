import { isTargetDiffSent } from '@src/domain.operations/review/isTargetDiffSent';
import { isTargetFileSent } from '@src/domain.operations/review/isTargetFileSent';
import { isTargetPayloadSent } from '@src/domain.operations/review/isTargetPayloadSent';

/**
 * .what = what the renderer actually SENDS for one target — its body, its diff,
 *         both, or neither
 * .why = 🔴 `isTargetDiffSent` and `isTargetPayloadSent` are two halves of ONE
 *        question, and a caller that reads one and not the other is wrong in
 *        exactly the direction the halves were extracted to prevent.
 *
 *        that is not hypothetical. `asTargetContentsForBreakdown` read the diff
 *        half alone and took no `focus`, so under `--focus pull` — where the
 *        renderer sends a PATH LIST and not one payload byte — it reported every
 *        target's full body weight for content the prompt never carried. the
 *        token-breakdown artifact and the live "top dirs" preview both read it.
 *
 *        ⇒ 🔴 `isTargetDiffSent`'s own doc-comment already names the lesson —
 *          *"an extracted decision binds only the call sites someone wired to
 *          it"* — and the drift recurred on the PEER axis nobody had wired. so
 *          the repair is not a third such act. it is to make the halves
 *          unreachable apart: this operation takes `focus` as a REQUIRED input,
 *          so a caller cannot express the half-question that was wrong
 *          (rule.prefer.most-common-denominator,
 *          rule.require.distinguish-every-review-input).
 *
 * .note = a DELETED target has `content: null` and renders as a lone void tag, so
 *         it sends no body — `sendsFile` is false for it even under push focus.
 *
 * .note = 🔴 this plan is wired at ONE of three eligible call sites, and it MUST
 *         STAY THAT WAY. the other two — the renderer (`compileReviewPrompt`) and
 *         the census (`getOnePromptComposition`) — each compose BOTH halves on
 *         their own, from the shared per-axis primitives (`isTargetDiffSent`,
 *         `isTargetFileSent`) plus their own focus gate. the primitives are shared,
 *         so the send question has one home per axis; the COMPOSITION and the chars
 *         measure are not, and that independence is not an oversight left over
 *         from the extraction above. it is the mechanism the attribution-drift
 *         detector runs on.
 *
 *         ⇒ the detector proves the census counted what the renderer SENT by a
 *           residual that goes NEGATIVE when the two disagree. route both through
 *           this one composed plan and they can no longer disagree on the focus
 *           gate or the measure, so the residual can no longer go negative — and
 *           the detector reports clean forever while it detects naught at all
 *           (rule.forbid.failhide).
 *
 *         ⚠️ so the extraction lesson one paragraph up does NOT generalize here,
 *           and this is the one place it inverts. `F11` is a DELIBERATE non-fix,
 *           reserved on its own fulcrum row, never a call site somebody forgot.
 */
export const getOneTargetRenderPlan = (input: {
  target: {
    content: string | null;
    diff?: string | null;
    changeKind?: 'new' | 'edited' | 'deleted';
  };
  focus: 'pull' | 'push';
}): { sendsFile: boolean; sendsDiff: boolean } => {
  // in `pull` focus the brain opens the files itself, so neither half rides
  const sendsPayload = isTargetPayloadSent({ focus: input.focus });

  return {
    sendsFile: sendsPayload && isTargetFileSent({ target: input.target }),
    sendsDiff: sendsPayload && isTargetDiffSent({ target: input.target }),
  };
};
