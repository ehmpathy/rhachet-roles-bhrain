/**
 * .what = whether a stone is named by a `--stone` value — exactly, or as a dotted descendant
 * .why = `--stone` is a PREFIX field, and a prefix with no delimiter matches a peer whose name
 *        merely begins the same way. `1.execute` matched `1.execute-b`, and that one fact made the
 *        budget gate's own remedy un-runnable: the scope refusal prints *"name the one stone you
 *        meant, in full"* and hands over `--stone 1.execute`, which re-matched both and refused
 *        again. ⇒ a dead loop, and `1.execute` was un-grantable for the life of the route
 *        (`rule.forbid.friction-hazards` — a remedy that dead-ends, raised i002/r009 b1).
 *
 * 🔴 .the delimiter is `.`, and it is the route's own segment separator.
 *    a stone name is dot-segmented (`5.1.execution.from_vision`), so `X` names `X` itself and
 *    every stone beneath `X.`. it does NOT name `X-b`, `X0`, or any other name that opens with
 *    those characters — those are peers that share a prefix, never descendants.
 *
 * 🔴 .this NARROWS the match, which is the safe direction and the only one available.
 *    a narrower predicate can touch fewer guards and never more, so no invocation that was
 *    refused becomes permitted-and-wider. what changes is the case the gate exists to serve: a
 *    driver that named one stone in full now resolves to that one stone.
 *
 * ⚠️ .F12's scope conjunct still fires where the invocation is genuinely ambiguous.
 *    `--stone 5` still names `5.1`, `5.2`, and `5.3` — each is a `5.` descendant — so the
 *    multi-match refusal holds where one warrant would otherwise buy rounds on three. what it
 *    stops to refuse is the invocation its own remedy told the driver to make.
 *
 * .note = it is applied at BOTH prefix sites, together. `getTargetGuardPathsForStone` (the guard
 *         set) and `getCurrentPeerMetersForStones` (the meter set) each stated that the two
 *         "agree by construction" and that a cut at one site alone would break it. one shared
 *         predicate is what keeps that agreement true through the change.
 */
export const isStoneMatchedByName = (input: {
  /** the stone's own name, as the route holds it */
  stone: string;
  /** the `--stone` value the caller typed */
  named: string;
}): boolean =>
  input.stone === input.named || input.stone.startsWith(`${input.named}.`);
