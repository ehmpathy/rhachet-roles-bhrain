/**
 * .what = the driver's signal vocabulary, emitted when a driver reaches for a human-only
 *         command (`--as approved`, `--as forced`, `--as overruled`)
 * .why = the refusal is the moment the driver most needs to know what they CAN run, so the
 *        list is the remedy rather than a footnote (rule.require.errors-name-the-fix).
 *
 * 🔴 .note = THREE call sites share this one list — `setStoneAsApproved`, `setStoneAsForced`,
 *        `setStoneAsOverruled` — and they differ by exactly one line, the `humanGrant` the
 *        parameter carries. a per-site copy is what
 *        `rule.forbid.duplicate-format-tree-operations` forbids, so the vocabulary lands here
 *        once and cannot drift across three homes.
 *
 * 🔴 .note = CONCEDE leads the two absorptions, and that order is the design (`S11`): a concede is
 *        the default absorption of a concern and a dispute is an escalation. the same order the
 *        absorb halt uses, for the same reason.
 *
 * ⚠️ .note = this is a VOCABULARY list — *"as a driver, you should"* — never a now-menu. the
 *        tea-pause menu in `stepRouteDrive` is the opposite shape (*"you must choose one"*) and
 *        deliberately carries NO absorption member: an absorption is pre-empted there by the
 *        blocker dispatcher, so a member would name a command the driver cannot use in that state.
 */
export const formatGuidanceForHumanOnlyCommand = (input: {
  /** the command the human will run — the one line that differs per call site */
  humanGrant: 'approved' | 'forced' | 'overruled';
}): string => {
  return [
    'as a driver, you should:',
    '   ├─ `--as passed` to signal work complete, proceed',
    '   ├─ `--as arrived` to signal work complete, request review',
    '   ├─ `--as conceded` to take a reviewer concern and repair it',
    '   ├─ `--as disputed` to escalate ONE concern to the council',
    '   └─ `--as blocked` to escalate a genuine wall',
    '',
    // 🔴 the qualifier carries the weight here, never a courtesy. `--as blocked`
    //    unqualified points a driver at the one exit
    //    rule.forbid.unanswered-exits-from-a-blocker forbids outright, so the bound
    //    rides with the command that needs it
    "🟡 a peer's feedback you have not absorbed is not a wall. absorb each",
    '   concern it raised — concede it, or dispute it.',
    '',
    `the human will run \`--as ${input.humanGrant}\` when ready.`,
  ].join('\n');
};
