/**
 * .what = the refusal a verb-specific flag earns when it is passed to a verb that does not own it
 * .why = a flag passed to the wrong `--as` would otherwise be dropped with no word, and a driver
 *        who mistyped the verb would watch their argument vanish (rule.forbid.failhide).
 *
 * 🔴 .why a TABLE rather than an `if` per flag = the `if` shape shipped THREE times and the fourth
 *    flag was never added to it. `--into` is REQUIRED on `--as promised` and was silently dropped
 *    on every other verb, which is the exact failure the `--that` check had been built to kill one
 *    round earlier. ⇒ the omission was not a forgotten line, it was the SHAPE: a hand-coded check
 *    per flag makes each new flag opt IN to validation, so the default for a new flag is silence.
 *    a table makes the flag declare its owners beside its peers, and a flag absent from the table
 *    is visible in a way a flag absent from an `if` chain is not.
 *    found by TWO independent lanes at i013 (r007 nitpick.1, r011 nitpick.1).
 *
 * 🔴 .why its OWN file = it is a pure, stateless table lookup, and it lived inline in
 *    `stepRouteStoneSet`'s body until i014 — ~75 lines of computation in an orchestrator, which
 *    `rule.forbid.decode-friction-in-orchestrators` forbids. two costs, both real and both paid:
 *    - its only coverage had to build a temp route, a stone, a guard, and a full context to
 *      exercise a table lookup, where `rule.require.test-coverage-by-grain` asks a pure
 *      transformer for a unit test with none of that
 *    - the inline table was built from heterogeneous tuple literals, so each row needed a
 *      `value as unknown` cast. a declared input type removes the cast rather than suppresses it
 *      (`rule.forbid.as-cast` — an `as` is a symptom, and the disease was the shape)
 *    ⇒ found by `enroll-impl-arch-defects` at i014, on the first architectural pass since i003.
 */
export interface StrayFlagRefusal {
  /** the flag that was passed to a verb that does not own it */
  flag: string;
  /** the full refusal message, ready to hand to a BadRequestError */
  message: string;
}

/**
 * .what = the two runnable absorption commands, each with the flag its verb requires
 * .why = shared by every absorption-family row, so a split in that family cannot drift the
 *        hint apart from itself
 */
const ABSORPTION_HINT = [
  ``,
  `to absorb a concern:`,
  `  --as conceded --with <reviewer> --about <concern> --severity better|urgent`,
  `  --as disputed --with <reviewer> --about <concern> --why <fulcrum-path>`,
];

/**
 * .what = the verbs each flag is accepted for, and what to say when it is not
 * .why = ONE table, read by ONE loop. a new flag must opt in to ACCEPTANCE rather than to
 *        validation, so the omission class is structurally unreachable rather than closed once.
 */
const asFlagOwnership = (input: {
  as: string;
  flags: {
    with?: string;
    about?: string;
    why?: string;
    severity?: string;
    that?: string;
    into?: string;
  };
}): {
  flag: string;
  value: string | undefined;
  allowedFor: string[];
  refusal: string;
  takesNone: string;
  hint: string[];
}[] => [
  // the three ADDRESSING flags share one family: both absorption verbs need to know which
  // reviewer, which concern, and (on a dispute) on what grounds
  ...(
    [
      ['--with', input.flags.with],
      ['--about', input.flags.about],
      ['--why', input.flags.why],
    ] as const
  ).map(([flag, value]) => ({
    flag,
    value,
    allowedFor: ['disputed', 'conceded'],
    refusal: `${flag} is only accepted for --as disputed | conceded`,
    takesNone: `you passed --as ${input.as}, which takes no absorption flags.`,
    // each taught command carries its REQUIRED flag — --severity on a concede, --why on a
    // dispute. a hint that hands back a command the boundary refuses is the friction hazard
    // `rule.forbid.friction-hazards` names (r9 b1)
    hint: ABSORPTION_HINT,
  })),
  // 🔴 --severity SHARES the family's `allowedFor`, and that is deliberate — it is not the
  //    drift it reads as. `repo-rules` nitpick.1 at i018 raised it as a disagreement with
  //    `stepRouteStoneSet`'s docblock ("not for --as disputed"), and the two answer DIFFERENT
  //    questions:
  //      - this table asks "is the flag in this verb's FAMILY?" → `--as passed --severity` is a
  //        mistyped verb, and the driver is told their whole absorption intent missed
  //      - `setStoneAsConcernAbsorbed` asks "is the flag SEMANTICALLY valid for this verb?" →
  //        `--as disputed --severity` is a real absorption verb with an invalid grade, and the
  //        driver is told WHY a dispute grades naught
  //
  // 🔴 .note = a narrow `['conceded']` was TRIED at i018 and REVERTED. the table runs first, so
  //    it shadowed the deeper operation's copy with a generic family refusal — a strictly worse
  //    message for the one case that has a better one. the revert is measured:
  //    `driver.route.absorption.acceptance.test.ts [case5]` went red on both its message
  //    assertion and its snapshot.
  //
  // ⚠️ .note = so the flag is NOT silently dropped, which is the harm the lane feared. it is
  //    refused one layer down, with better words, and `[case5]` has pinned that whole message
  //    since before this round. ⇒ two layers, two questions, no second source of truth.
  {
    flag: '--severity',
    value: input.flags.severity,
    allowedFor: ['disputed', 'conceded'],
    refusal: `--severity is only accepted for --as disputed | conceded`,
    takesNone: `you passed --as ${input.as}, which takes no absorption flags.`,
    hint: ABSORPTION_HINT,
  },
  // --that: a `--as passed --that architect` silently read the passed branch, and a
  // `--as disputed --that architect` silently read only with/about/why/severity, so a
  // mistyped verb on the --that side never told the driver (r002 nitpick.1, i005)
  {
    flag: '--that',
    value: input.flags.that,
    allowedFor: ['promised', 'absorbed'],
    refusal: `--that is only accepted for --as promised | absorbed`,
    takesNone: `you passed --as ${input.as}, which takes no --that.`,
    hint: [],
  },
  // --into: the round's one added flag, and the one the `if` chain never grew a check for
  {
    flag: '--into',
    value: input.flags.into,
    allowedFor: ['promised'],
    refusal: `--into is only accepted for --as promised`,
    takesNone: `you passed --as ${input.as}, which takes no --into.`,
    hint: [
      ``,
      `to promise a self review:`,
      `  --as promised --that <slug> --into <path-you-wrote-to>`,
    ],
  },
];

/**
 * .what = finds the first flag passed to a verb that does not own it, and builds its refusal
 * .why = so the orchestrator reads as narrative: one call, one branch, one throw
 *
 * .note = returns null when every passed flag is owned by the verb — the common case
 */
export const getStrayFlagRefusal = (input: {
  as: string;
  flags: {
    with?: string;
    about?: string;
    why?: string;
    severity?: string;
    that?: string;
    into?: string;
  };
}): StrayFlagRefusal | null => {
  const strayFlag = asFlagOwnership(input).find(
    (owned) =>
      owned.value !== undefined && !owned.allowedFor.includes(input.as),
  );
  if (!strayFlag) return null;

  return {
    flag: strayFlag.flag,
    message: [
      strayFlag.refusal,
      ``,
      strayFlag.takesNone,
      ...strayFlag.hint,
    ].join('\n'),
  };
};
