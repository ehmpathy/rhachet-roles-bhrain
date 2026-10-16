/**
 * .what = whether the target PAYLOAD — diffs and file bodies — reaches the prompt
 * .why = 🔴 the peer of `isTargetDiffSent`, one axis up. that one decides which
 *        targets send a diff; this decides whether any target sends a payload at
 *        all, and the answer is the `focus`.
 *
 *        in `pull` focus the renderer injects a PATH LIST only — the brain has
 *        tool use, so it opens the files itself. no `<target.diff>`, no
 *        `<target.file>`, not one byte of either. in `push` focus both ride.
 *
 *        the failure it prevents is the same one, and worse: a census that sums
 *        every target's `.content` under pull counts a payload the prompt never
 *        carried, so the named rows sum ABOVE `chars` and `markup` — the residual
 *        — goes deeply NEGATIVE. every row still carries a figure, the rows still
 *        sum to `chars` by algebra, and `getOnePromptSectionCharsFromCompiled` later
 *        throws on the artifact it wrote (rule.require.distinguish-every-review-input).
 *
 * .note = so `compileReviewPrompt` and `getOnePromptComposition` both call this,
 *         and neither restates it. the decision has exactly one home, which is the
 *         lesson `isTargetDiffSent` was extracted to teach and this call site did
 *         not inherit.
 */
export const isTargetPayloadSent = (input: {
  focus: 'pull' | 'push';
}): boolean => input.focus === 'push';
