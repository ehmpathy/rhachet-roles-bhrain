/**
 * .what = consumes the level-pour ANNOUNCE from the HEAD of a captured stderr,
 *         and returns every byte after it verbatim
 *
 * .why  = the assertion it serves is *"no GUARD RESULT reaches stderr"*, and its
 *         teeth are `toEqual('')` — the first byte of any result output goes
 *         red, with no baseline to mint. the concurrent pour added a LIVENESS
 *         writer to the same stream (`asReviewLevelPourAnnounce`), so the raw
 *         comparison could no longer be empty. this removes the one known
 *         liveness shape so the emptiness claim keeps its teeth
 *
 * 🔴 .why it consumes a PREFIX rather than filters by shape = the prior form
 *         dropped every announce-shaped line wherever it sat, which made it a
 *         text-pixel heuristic: a guard RESULT line that collided with the
 *         roster grammar was indistinguishable from the liveness line, so it
 *         was stripped and `toEqual('')` passed on data it never saw — a
 *         failhide inside the very clamp that exists to prevent one. the
 *         announce is emitted at t≈0, BEFORE any lane settles, so its position
 *         is a real structural property rather than a convenience:
 *
 *         | a line that… | the filter did | this does |
 *         |---|---|---|
 *         | is the announce, at the head | strip ✅ | consume ✅ |
 *         | is a RESULT, roster-shaped, mid-stream | 🔴 **strip** — silent | ✅ **return** — red |
 *         | is a RESULT, any other shape | return ✅ | return ✅ |
 *
 *         ⇒ the middle row is the repair. raised i033/r9
 *
 * .why a NAMED transformer = the shapes are two regexes whose intent a reader
 *         must otherwise simulate to confirm the assertion is about "no result"
 *         and not "no stderr at all" (`rule.require.named-transformers`, raised
 *         i031/r3). named once, the two live in one testable place
 *
 * ⚠️ .the residual, stated rather than papered over = a result line that sits at
 *     the head AND spells the header grammar verbatim (`🦉 l3 pours 2 lanes`) is
 *     still consumed. that collision is the announce's own sentence, so it is a
 *     far narrower window than the shape filter's — which collided with the
 *     guard tree's every `├─ rN:` row
 *
 * 🔴 .the bound = it consumes announce blocks and NO other line. the F13 leak
 *     advisory also rides stderr, deliberately unconsumed — it fires only on a
 *     guard that mixes a bounded group with an ungrouped lane, which no fixture
 *     here does, so its appearance in one of these suites is a real find rather
 *     than noise to filter
 */
export const asStderrSansPourAnnounce = (input: {
  /** the captured stderr, verbatim */
  stderr: string;
}): string => {
  const lines = input.stderr.split('\n');

  let cursor = 0;
  while (cursor < lines.length) {
    // a blank line separates one level's block from the next
    if (lines[cursor]!.trim() === '') {
      cursor += 1;
      continue;
    }

    // a block opens with the header — or the announce prefix is over
    if (!ANNOUNCE_HEADER.test(lines[cursor]!)) break;
    cursor += 1;

    // then its roster, one line per member, and no other shape
    while (cursor < lines.length && ANNOUNCE_ROSTER.test(lines[cursor]!))
      cursor += 1;
  }

  return lines.slice(cursor).join('\n').trim();
};

/** .what = the announce's own header shape, and only it */
const ANNOUNCE_HEADER = /^🦉 l\d+ pours \d+ lanes?/;

/**
 * .what = the announce's roster shape — one line per member
 * .why  = the tree glyph varies by position (`├─` for every member but the last,
 *         `└─` for the last), so the pattern matches the indent and the `rN:`
 *         key rather than the glyph
 */
const ANNOUNCE_ROSTER = /^\s+[├└]─ r\d+:/;
