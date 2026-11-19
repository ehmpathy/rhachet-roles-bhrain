import { asBashQuotesMasked } from './asBashQuotesMasked';

/**
 * .what = data-driven cases for the quote and escape mask of a command line
 * .why = every operator scan reads the mask; a span it misreads is a split it misses
 */
const TEST_CASES: Array<{
  description: string;
  command: string;
  expect: string;
}> = [
  { description: 'no quotes', command: 'cp a; b', expect: 'cp a; b' },
  { description: 'double quotes', command: 'x "a;b" c', expect: 'x "___" c' },
  { description: 'single quotes', command: "x 'a|b' c", expect: "x '___' c" },
  {
    description: 'an escaped quote outside quotes opens no span',
    command: 'echo \\"; cp a',
    expect: 'echo __; cp a',
  },
  {
    description: 'an escaped quote inside double quotes stays inside',
    command: 'echo "a\\";b"; cp',
    expect: 'echo "_____"; cp',
  },
  {
    description: "a $'…' span honors a backslash",
    command: "echo $'a\\'b'; cp",
    expect: "echo $'____'; cp",
  },
  {
    description: 'a backslash inside single quotes is literal',
    command: "echo 'a\\'; cp",
    expect: "echo '__'; cp",
  },
  {
    description: 'an escaped separator outside quotes',
    command: 'find . -exec cp {} M \\; ',
    expect: 'find . -exec cp {} M __ ',
  },
  {
    description: 'an emoji keeps each offset after it',
    command: 'echo 🦉; cp',
    expect: 'echo 🦉; cp',
  },
  {
    description: 'an emoji inside quotes masks to one mark per code unit',
    command: 'echo "🦉"; cp',
    expect: 'echo "__"; cp',
  },
];

describe('asBashQuotesMasked', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const masked = asBashQuotesMasked({ command: thisCase.command });
      expect(masked).toEqual(thisCase.expect);
      expect(masked.length).toEqual(thisCase.command.length);
    }),
  );
});
