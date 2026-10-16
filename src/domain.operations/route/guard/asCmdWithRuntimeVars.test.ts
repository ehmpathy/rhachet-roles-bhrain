import { asCmdWithRuntimeVars } from './asCmdWithRuntimeVars';

const VALUES = {
  $route: '.behavior/v1',
  $stone: '1.vision',
  $hash: 'abc',
  $output: 'out.md',
  $rhx: '/repo/node_modules/.bin/rhx',
  $rhachet: '/repo/node_modules/.bin/rhachet',
  $targets: 'a.ts,b.ts',
  $conversation: '$conversation',
};

const TEST_CASES = [
  {
    description: 'replaces every occurrence of each var',
    given: { cmd: '$rhx review --route $route --stone $stone --into $route/x' },
    expect: {
      output:
        '/repo/node_modules/.bin/rhx review --route .behavior/v1 --stone 1.vision --into .behavior/v1/x',
    },
  },
  {
    description: 'a passthrough value leaves the var literal',
    given: { cmd: 'echo $conversation $targets' },
    expect: { output: 'echo $conversation a.ts,b.ts' },
  },
  {
    description: 'a cmd with no vars passes through unchanged',
    given: { cmd: 'echo hello' },
    expect: { output: 'echo hello' },
  },
  {
    // 🔴 a replacement STRING reads `$&` as "the match"; the replacer function
    //    inserts the value byte for byte
    description:
      'a value with a replacement pattern inside is inserted literally',
    given: {
      cmd: 'cat $output',
      values: { ...VALUES, $output: 'dir$&/a$1b.md' },
    },
    expect: { output: 'cat dir$&/a$1b.md' },
  },
  {
    // 🔴 one pass: an inserted value is never re-scanned for a var name
    description: 'a value that holds a var name is not substituted again',
    given: {
      cmd: 'cat $output',
      values: { ...VALUES, $output: '$route/out.md' },
    },
    expect: { output: 'cat $route/out.md' },
  },
];

describe('asCmdWithRuntimeVars', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asCmdWithRuntimeVars({
          cmd: thisCase.given.cmd,
          valueByName:
            'values' in thisCase.given && thisCase.given.values
              ? thisCase.given.values
              : VALUES,
        }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
