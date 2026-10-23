import { asReviewPartitionDeclarationParts } from './asReviewPartitionDeclarationParts';

/**
 * .what = the shape a partition slug must take
 * .why = the slug names a log dir, a report section, and a refusal row — so it is a plain
 *        token, never a path
 */
const SLUG_OF_PARTITION_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

/**
 * .what = the example every fault falls back on, in the forms a caller may write
 */
const HINT_OF_FORMS =
  "e.g. --partition 'review=src/domain.operations/review/**,src/domain.objects/**' (repeat a slug to add a glob)";

/**
 * .what = a value as a corrected flag the caller can paste
 */
const asFixOfValue = (input: { value: string }): string =>
  `fix: --partition '${input.value}'`;

/**
 * .what = a plain slug from any text — lowercased, each run of other chars cut to `-`
 * .why = a fault for a bad slug proposes the nearest slug that parses, so the fix is a paste
 */
const asSlugOfText = (input: { text: string }): string =>
  input.text
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[^a-z0-9]+/, '')
    .replace(/[._-]+$/, '');

/**
 * .what = the slug a slugless glob most likely meant — the last literal dir it is rooted at
 * .why = `src/domain.operations/review/**` names the `review` subtree, so `review` is the
 *        slug a caller would have typed; `<slug>` where the glob has no literal dir
 */
const asSlugOfGlob = (input: { glob: string }): string => {
  const firstToken = input.glob.search(/[*?[{,]/);
  const literal =
    firstToken === -1 ? input.glob : input.glob.slice(0, firstToken);
  const last =
    literal
      .split('/')
      .filter((dir) => dir)
      .at(-1) ?? '';
  return asSlugOfText({ text: last }) || '<slug>';
};

/**
 * .what = a glob text with every stray `}` dropped and every open `{` closed at its end
 * .why = 🔴 an unbalanced brace is the classic fiddle of a long brace list; a fault that only
 *        says "unbalanced" sends the caller to count braces by hand. this proposes the nearest
 *        text that parses, so the caller reads it and pastes it
 */
const asTextBraceBalanced = (input: { text: string }): string => {
  const walked = [...input.text].reduce<{ out: string; depth: number }>(
    (acc, char) => {
      if (char === '{') return { out: acc.out + char, depth: acc.depth + 1 };
      if (char === '}' && acc.depth === 0) return acc;
      if (char === '}') return { out: acc.out + char, depth: acc.depth - 1 };
      return { out: acc.out + char, depth: acc.depth };
    },
    { out: '', depth: 0 },
  );
  return walked.out + '}'.repeat(walked.depth);
};

/**
 * .what = a glob text with its whole-text brace set unwrapped to a bare comma list
 * .why = 🔴 a comma list needs no brace (seed S53), and a brace the shell could expand is the
 *        fiddle that broke the declaration; so the fix proposes the form with none.
 *        `{a,b/{c,d}}` → `a,b/{c,d}` — an inner brace set is a glob's own, and kept
 */
const asTextUnwrapped = (input: { text: string }): string => {
  // only a brace that opens at the head and closes at the tail wraps the whole text
  if (!input.text.startsWith('{') || !input.text.endsWith('}'))
    return input.text;
  const depthAt = [...input.text].reduce<number[]>((acc, char) => {
    const prior = acc.at(-1) ?? 0;
    if (char === '{') return [...acc, prior + 1];
    if (char === '}') return [...acc, prior - 1];
    return [...acc, prior];
  }, []);
  const closesEarly = depthAt.slice(0, -1).some((depth) => depth === 0);
  return closesEarly ? input.text : input.text.slice(1, -1);
};

/**
 * .what = whether every `{` in a text closes, in order
 * .why = an unclosed brace list is not a brace list to the parser or the matcher, so it
 *        would claim naught in silence where the other partitions cover every target
 */
const isBraceBalanced = (input: { text: string }): boolean =>
  asTextBraceBalanced({ text: input.text }) === input.text;

/**
 * .what = whether a value tries to append with `<slug>+=<globs>`
 * .why = a declaration states its whole set (seed S46), so there is no append verb; the
 *        same intent is one more `<slug>=<glob>` flag, which merges into the slug
 */
const isAppendAttempt = (input: { value: string }): boolean =>
  /^[^=]*\+=/.test(input.value);

/**
 * .what = the first defect in a set of `--partition` declarations, or null when all parse
 * .why = 🔴 a malformed declaration refuses, loud, with the CORRECTED declaration — at the cli
 *        before any brain cost, and again at the parser, so no path reaches a split it cannot
 *        read, and no caller loops on trial and error to find the form that parses
 *
 * .note = a slug declared twice is no fault: its flags merge into one partition, so a driver
 *         widens a partition by one more flag (`asReviewPartitionsFromFlags`)
 */
export const getOneReviewPartitionsFault = (input: {
  partition: string[];
}): { headline: string; hint: string } | null => {
  // an append attempt names the form that does append
  const append = input.partition.find((value) => isAppendAttempt({ value }));
  if (append !== undefined)
    return {
      headline: `--partition '${append}' does not parse; there is no '+=' — repeat the slug instead, and its globs merge`,
      hint: asFixOfValue({ value: append.replace('+=', '=') }),
    };

  // each value must name a slug ahead of its first =
  const slugless = input.partition.find((value) => !value.includes('='));
  if (slugless !== undefined)
    return {
      headline: `--partition '${slugless}' does not parse; it names no slug — the form is '<slug>=<globs>'`,
      hint: asFixOfValue({
        value: `${asSlugOfGlob({ glob: slugless.trim() })}=${slugless.trim()}`,
      }),
    };

  // each slug must be a plain lowercase token
  const badSlug = input.partition
    .map((value) => ({
      value,
      parts: asReviewPartitionDeclarationParts({ value }),
    }))
    .find((one) => !SLUG_OF_PARTITION_PATTERN.test(one.parts.slug));
  if (badSlug !== undefined)
    return {
      headline: `--partition '${badSlug.value}' does not parse; the slug '${badSlug.parts.slug}' must be lowercase letters, digits, '.', '_' or '-'`,
      hint: asFixOfValue({
        value: `${asSlugOfText({ text: badSlug.parts.slug }) || asSlugOfGlob({ glob: badSlug.parts.globsText })}=${badSlug.parts.globsText}`,
      }),
    };

  // each value must name at least one glob
  const globless = input.partition.find(
    (value) =>
      asReviewPartitionDeclarationParts({ value }).globsText.replace(
        /[{},\s]/g,
        '',
      ).length === 0,
  );
  if (globless !== undefined)
    return {
      headline: `--partition '${globless}' does not parse; it names no glob`,
      hint: HINT_OF_FORMS,
    };

  // each brace must close; an unclosed list parses as one literal glob that claims naught
  const unbalanced = input.partition
    .map((value) => asReviewPartitionDeclarationParts({ value }))
    .find((parts) => !isBraceBalanced({ text: parts.globsText }));
  if (unbalanced !== undefined)
    return {
      headline: `--partition '${unbalanced.slug}' has unbalanced braces in '${unbalanced.globsText}'`,
      hint: asFixOfValue({
        value: `${unbalanced.slug}=${asTextUnwrapped({ text: asTextBraceBalanced({ text: unbalanced.globsText }) })}`,
      }),
    };

  return null;
};
