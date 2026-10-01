/**
 * .what = the brain a peer review's `run:` line declares, or WHY none was read
 * .why = `undeclared` (the reviewer takes its tool's default) and `unreadable` (it declared one
 *        this reader cannot see) render differently; a cost row that fused them would price a
 *        round on a claim no one made
 *
 * .note = a discriminated union, never `string | null`, so the fused state is unrepresentable
 *         (`rule.prefer.prevent-over-correct`). same value-or-cause shape as `CloneAddressRead`
 */
export type ReviewPeerBrainRead =
  | { brain: string; cause?: undefined }
  | { brain: null; cause: 'undeclared' | 'unreadable' };

/**
 * .what = reads the brain a peer review's own `run:` line declares
 * .why = case=9 [t4] answers "what did i just buy?" at stone entry with each reviewer's brain
 *        beside the driver's
 *
 * .note = reads both `--brain <slug>` (`rhx review`) and `--model <arg>` (`rhx enroll`): the
 *         same axis for the clone that line spawns
 * .note = a value that is not a plain literal — a substitution, an unclosed or escaped quote —
 *         reports `unreadable`, never its source text. `case5` [t0]–[t1e] clamp this. an exact
 *         read needs a structured `RouteStoneGuardReviewPeer.brain` field (F5/F12 cluster)
 * .note = it reads the DECLARATION, never the live subprocess (F12)
 */
export const asReviewPeerBrain = (input: {
  run: string;
}): ReviewPeerBrainRead => {
  // search the MASKED run, then read the value out of the original
  // .why = a `--brain` inside a quoted prompt is prose, not a declaration. the mask keeps
  //        length, so every index maps 1:1 onto the original
  const matched = FLAG_DECLARED.exec(asQuotedSpansMasked({ run: input.run }));

  // no flag with a value → the reviewer declared none
  if (!matched?.[2]) return { brain: null, cause: 'undeclared' };

  // the group sits at the tail of the whole match, and the mask preserved every offset
  const raw = input.run.slice(
    matched.index + matched[0].length - matched[2].length,
    matched.index + matched[0].length,
  );

  // strip one matched pair of quotes — `--model 'claude-sonnet-5[1m]'` is quoted for its brackets
  const value = raw.replace(/^["'](.*)["']$/, '$1').trim();

  // an empty value (`--brain ''`) applies no brain → `undeclared`, the accurate cell
  // .note = must precede the literal test: '' fails `LITERAL_SLUG` and would read `unreadable`
  if (!value) return { brain: null, cause: 'undeclared' };

  // abstain on any value that is not a plain literal, rather than return its source text
  if (!LITERAL_SLUG.test(value)) return { brain: null, cause: 'unreadable' };

  return { brain: value };
};

/**
 * .what = the flag token, and the value that follows it
 * .why = one pattern, run against both the masked and the original run
 *
 * .note = anchors on `(^|\s)`, not `\s`: a run that opens directly on `--brain` must still
 *         match. the same anchor applies in `asCommentCut` — keep them in step
 * .note = the value is group TWO; group one (the anchor) may match '' at index 0
 */
const FLAG_DECLARED = /(^|\s)--(?:brain|model)[\s=]+('[^']*'|"[^"]*"|\S+)/;

/**
 * .what = the characters a brainslug is made of, and no others
 * .why = an ALLOWLIST: a blocklist of shell metacharacters is always one character behind, and
 *        this fails safe — an unknown character yields no slug, never a fabricated one
 *        (`rule.forbid.failhide`). e.g. `--brain opus$(cat .brain)` must not yield `opus$(cat`
 *
 * .note = the `-` sits LAST, where it is a literal rather than a range
 */
const LITERAL_SLUG = /^[A-Za-z0-9._/[\]-]+$/;

/**
 * .what = blanks the CONTENT of every quoted span, and keeps its length
 * .why = a flag mentioned inside a prompt is not a flag: `rhx review -p 'use --brain opus'`
 *        must not yield `opus`
 *
 * .note = length preserved so the caller reads the value from the ORIGINAL at the same offsets
 * .note = the mask char is NUL (non-space), so a quoted value still matches as one token; the
 *         quotes themselves survive as delimiters
 */
const asQuotedSpansMasked = (input: { run: string }): string => {
  // .note = a deliberate accumulator mutation, scoped to this pure char walk
  let quote: "'" | '"' | null = null;
  let out = '';

  for (const char of input.run) {
    if (quote) {
      out += char === quote ? char : '\0';
      if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      out += char;
      continue;
    }
    out += char;
  }

  return out;
};
