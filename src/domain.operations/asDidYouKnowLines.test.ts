import { given, then, when } from 'test-fns';

import { asDidYouKnowLines, HEADER_OF_DID_YOU_KNOW } from './asDidYouKnowLines';

const TEST_CASES = [
  {
    description: 'no row renders no block',
    given: { rows: [] as string[] },
    expect: { lines: [] as string[] },
  },
  {
    description: 'one row closes the block on itself',
    given: { rows: ['run rhx route.drive'] },
    expect: {
      lines: ['', '✨ did you know?', '   └─ run rhx route.drive'],
    },
  },
  {
    description: 'several rows close on the last',
    given: { rows: ['claim each domain whole', 'e.g. src/route/**'] },
    expect: {
      lines: [
        '',
        '✨ did you know?',
        '   ├─ claim each domain whole',
        '   └─ e.g. src/route/**',
      ],
    },
  },
];

describe('asDidYouKnowLines', () => {
  given('[case1] each row set', () => {
    when('[t0] the block is rendered', () => {
      TEST_CASES.map((thisCase) =>
        then(thisCase.description, () => {
          const lines = asDidYouKnowLines({ rows: thisCase.given.rows });
          expect(lines).toEqual(thisCase.expect.lines);
        }),
      );

      then('the header is the house phrase, with no colon label', () => {
        expect(HEADER_OF_DID_YOU_KNOW).toEqual('✨ did you know?');
        const text = asDidYouKnowLines({ rows: ['x'] }).join('\n');
        expect(text).not.toContain('tip:');
        expect(text).not.toContain('hint:');
      });
    });
  });
});
