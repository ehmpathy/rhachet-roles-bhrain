import { asDidYouKnowLines } from '@src/domain.operations/asDidYouKnowLines';

import { asTreeLeaves } from './asTreeLeaves';

/**
 * .what = renders a halt as the owl vibe line, then one tree: the class, each fact a leaf,
 *         and the fix last; an alternate move, when one exists, follows as its own block
 * .why = an error is the moment a human most needs the path forward; a raw json dump
 *        buries the fix under its own punctuation
 */
export const formatTokenSpendErrorTree = (input: {
  header: '✋ ConstraintError' | '💥 MalfunctionError';
  message: string;
  facts: Record<string, unknown> | null;
}): string => {
  const facts = input.facts ?? {};
  const leaves: { line: string; children: string[] }[] = [
    ...Object.entries(facts)
      .filter(([key]) => !KEYS_OF_REMEDY.has(key))
      .map(([key, value]) => asFactLeaf({ key, value })),
    ...asRemedyLeaf({ label: 'why', text: facts.why, run: undefined }),
    ...asRemedyLeaf({ label: 'fix', text: facts.hint, run: facts.hintRun }),
  ];
  return [
    input.header === '✋ ConstraintError'
      ? '🦉 the pond is still; naught to reflect'
      : '🦉 the pond is clouded; the read broke',
    '',
    '🌕 reflect.on.token.spend',
    `   └─ ${input.header}: ${input.message}`,
    ...asTreeLeaves({ leaves }).map((line) => `      ${line}`),
    ...asDidYouKnowLines({
      rows: asAlternateRows({ text: facts.or, run: facts.orRun }),
    }),
    '',
  ].join('\n');
};

/**
 * .what = the metadata keys that carry the path forward, rendered last and in order
 * .why = a halt reads facts first, then why, then the fix; the alternative renders apart, as
 *        a next move a reader may take, never a leaf of the diagnosis
 *        (rule.require.coconut-hints)
 */
const KEYS_OF_REMEDY = new Set(['why', 'hint', 'hintRun', 'or', 'orRun']);

/**
 * .what = one remedy leaf — `why:` or `fix:` — with its runnable command beneath
 * .why = a fix a human can paste beats a fix they must compose
 */
const asRemedyLeaf = (input: {
  label: 'why' | 'fix';
  text: unknown;
  run: unknown;
}): { line: string; children: string[] }[] => {
  if (typeof input.text !== 'string') return [];
  return [
    {
      line: `${input.label}: ${input.text}`,
      children: typeof input.run === 'string' ? [input.run] : [],
    },
  ];
};

/**
 * .what = the alternate move as one hint row, its command named last
 * .why = the row a reader acts on is the command, so it closes the row
 */
const asAlternateRows = (input: { text: unknown; run: unknown }): string[] => {
  if (typeof input.text !== 'string') return [];
  if (typeof input.run !== 'string') return [input.text];
  return [`${input.text}, run \`${input.run}\``];
};

/**
 * .what = one metadata fact as a leaf: a list hangs its items beneath its key
 * .why = one fact per leaf; a list of roots or paths reads as a list, never a json array
 */
const asFactLeaf = (input: {
  key: string;
  value: unknown;
}): { line: string; children: string[] } => {
  if (Array.isArray(input.value))
    return {
      line: `${input.key} (${input.value.length})`,
      children: input.value.map((item) => asFactText({ value: item })),
    };
  return {
    line: `${input.key} = ${asFactText({ value: input.value })}`,
    children: [],
  };
};

/**
 * .what = a fact value as one line of text
 * .why = a string reads bare; a number, a boolean, or an object reads as compact json
 */
const asFactText = (input: { value: unknown }): string =>
  typeof input.value === 'string' ? input.value : JSON.stringify(input.value);
