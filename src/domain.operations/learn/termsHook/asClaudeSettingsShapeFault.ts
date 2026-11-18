/**
 * .what = whether a value is a plain object, not an array, null, or a scalar
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * .what = a value's kind, in the words a human reads it
 */
const asValueKindText = (input: { value: unknown }): string => {
  if (input.value === null) return 'null';
  if (Array.isArray(input.value)) return 'a list';
  if (typeof input.value === 'object') return 'an object';
  return `a ${typeof input.value}`;
};

/**
 * .what = the first declared key of a record whose value is present but of another kind
 * .why = the settings type declares these keys optional and typed; a `"author": 5` must be
 *        named, never carried through typed as a string
 */
const asKeyKindFault = (input: {
  record: Record<string, unknown>;
  at: string;
  kinds: Record<string, 'string' | 'number'>;
}): string | null => {
  const entryFault = Object.entries(input.kinds).find(
    ([key, kind]) =>
      input.record[key] !== undefined && typeof input.record[key] !== kind,
  );
  if (!entryFault) return null;
  const [key, kind] = entryFault;
  return `${input.at}.${key} is ${asValueKindText({ value: input.record[key] })}, not a ${kind}`;
};

/**
 * .what = the first fault inside one block, or null when the block holds the declared shape
 */
const asHookBlockFault = (input: {
  block: unknown;
  at: string;
}): string | null => {
  if (!isPlainObject(input.block))
    return `${input.at} is ${asValueKindText({ value: input.block })}, not an object`;
  const matcherFault = asKeyKindFault({
    record: input.block,
    at: input.at,
    kinds: { matcher: 'string' },
  });
  if (matcherFault) return matcherFault;
  if (input.block.hooks === undefined) return null;
  if (!Array.isArray(input.block.hooks))
    return `${input.at}.hooks is ${asValueKindText({ value: input.block.hooks })}, not a list`;
  return (
    input.block.hooks
      .map((hook: unknown, index: number) => {
        const at = `${input.at}.hooks[${index}]`;
        if (!isPlainObject(hook))
          return `${at} is ${asValueKindText({ value: hook })}, not an object`;
        return asKeyKindFault({
          record: hook,
          at,
          kinds: {
            type: 'string',
            command: 'string',
            timeout: 'number',
            author: 'string',
          },
        });
      })
      .find((fault: string | null) => fault !== null) ?? null
  );
};

/**
 * .what = where a parsed json value first breaks the settings shape every toggle verb walks,
 *         or null when it holds the shape
 * .why = a refusal that names only "a shape it cannot walk" leaves the human to search the file;
 *        the first fault, as a path (`hooks.Stop is a string, not a list`), names the place to
 *        repair, as the parse leaf does for a json fault
 *
 * .note = it checks exactly what `ClaudeSettingsOfRepo` declares: `hooks` → event → block
 *         (`matcher`) → inner hook (`type`, `command`, `timeout`, `author`). every other key is
 *         carried through untouched, whatever it holds
 */
export const asClaudeSettingsShapeFault = (input: {
  value: unknown;
}): string | null => {
  // the file is one object
  if (!isPlainObject(input.value))
    return `the file holds ${asValueKindText({ value: input.value })}, not an object`;

  // no hooks key: naught more to walk
  if (input.value.hooks === undefined) return null;

  // hooks → each event is a list of blocks → each block of the declared shape
  if (!isPlainObject(input.value.hooks))
    return `hooks is ${asValueKindText({ value: input.value.hooks })}, not an object`;
  return (
    Object.entries(input.value.hooks)
      .map(([event, blocks]) => {
        if (!Array.isArray(blocks))
          return `hooks.${event} is ${asValueKindText({ value: blocks })}, not a list`;
        return (
          blocks
            .map((block: unknown, index: number) =>
              asHookBlockFault({ block, at: `hooks.${event}[${index}]` }),
            )
            .find((fault: string | null) => fault !== null) ?? null
        );
      })
      .find((fault) => fault !== null) ?? null
  );
};
