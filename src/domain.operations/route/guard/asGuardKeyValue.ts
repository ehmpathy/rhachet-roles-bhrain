/**
 * .what = the INLINE value a guard line carries after its key, unquoted and trimmed —
 *         or '' when the key carries none
 * .why = EXTRACTED from an inline `rest.join(':').trim().replace(/^["'](.*)["']$/, '$1')
 *        .trim()`. a chained pipeline of string ops states what it DOES and never what
 *        it PRODUCES, so a reader must simulate four steps to learn the result
 *        (`rule.forbid.inline-decode-friction`)
 *
 * .note = 🔴 it trims on BOTH sides of the quote strip, never only before it. the outer
 *         trim cannot reach inside quotes, so `brain: "  "` survived it as `'  '` —
 *         TRUTHY, and a truthy value dispatches `/model   ` with a blank argument into
 *         the live clone. the second trim closes the whole empty-value class rather than
 *         the one input that was clamped (`rule.require.clamp-edge-cases`)
 *
 * .note = it joins on ':' rather than takes element 1, because a value may hold colons —
 *         `brain: anthropic/claude:opus` is one key and one value, never three
 *
 * .note = '' rather than null for an absent value. the callers each test truthiness, and
 *         a `string | null` would add a second falsy form to every one of them with no
 *         caller able to act on the difference
 */
export const asGuardKeyValue = (input: { line: string }): string => {
  const [, ...rest] = input.line.trim().split(':');
  const declared = asCommentCut({ value: rest.join(':').trim() });

  return declared.replace(/^["'](.*)["']$/, '$1').trim();
};

/**
 * .what = the value with any ` # …` remark at its tail removed
 * .why = a guard is hand-written, and `brain: claude-opus-5[1m] # for verification` is
 *        what a hand writes. without this the whole tail rides into `/model`, so a
 *        remark silently changes the brain that is requested — an unexpected default
 *        the author cannot see, since the guard reads exactly as they meant it
 *
 * .note = a QUOTED value is cut after the quote that shuts it, never at the first `#`.
 *         the quotes exist to carry odd characters, so `brain: 'a#b'` must keep its `#`
 *         and `brain: 'a' # note` must lose its tail — one rule covers both
 *
 * .note = an unquoted `#` must open the value or follow whitespace, which is the yaml
 *         convention. a bare `a#b` is one token, and to cut it would mangle a value
 *         nobody remarked on
 *
 * .note = 🔴 the START anchor carries the whole load, and its absence was a real defect.
 *         the caller trims BEFORE this runs, so `brain: # the whole value is a remark`
 *         arrives with its `#` at index 0 and no whitespace in front of it. a
 *         whitespace-only cut found no match and handed the entire remark back as the
 *         value — so a guard that declared no brain at all would dispatch `/model # the
 *         whole value is a remark` into the live clone
 */
const asCommentCut = (input: { value: string }): string => {
  const quote = input.value[0];
  if (quote === "'" || quote === '"') {
    const shut = input.value.indexOf(quote, 1);
    if (shut !== -1) return input.value.slice(0, shut + 1);
    return input.value;
  }

  const remark = /(^|\s)#/.exec(input.value);
  if (!remark) return input.value;

  return input.value.slice(0, remark.index).trim();
};
