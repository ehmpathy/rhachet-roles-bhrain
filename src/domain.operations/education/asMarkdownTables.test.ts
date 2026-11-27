import { asMarkdownTables } from './asMarkdownTables';

const TEST_CASES = [
  {
    description: 'reads one table: header and rows',
    given: [
      'intro',
      '',
      '| a | b |',
      '|---|---|',
      '| 1 | 2 |',
      '| 3 | 4 |',
      '',
      'outro',
    ].join('\n'),
    expect: [
      {
        header: ['a', 'b'],
        rows: [
          ['1', '2'],
          ['3', '4'],
        ],
      },
    ],
  },
  {
    description: 'reads two tables in document order',
    given: [
      '| x |',
      '|---|',
      '| 1 |',
      '',
      '| y | z |',
      '|:---|---:|',
      '| 2 | 3 |',
    ].join('\n'),
    expect: [
      { header: ['x'], rows: [['1']] },
      { header: ['y', 'z'], rows: [['2', '3']] },
    ],
  },
  {
    description: 'reads no table from a pipe line with no divider',
    given: '| not | a table |\nprose',
    expect: [],
  },
  {
    description: 'reads a table whose divider has one dash per cell',
    given: '| a | b |\n|-|:-:|\n| 1 | 2 |',
    expect: [{ header: ['a', 'b'], rows: [['1', '2']] }],
  },
  {
    description: 'reads a table that ends the text',
    given: '| a |\n|---|\n| 1 |',
    expect: [{ header: ['a'], rows: [['1']] }],
  },
];

describe('asMarkdownTables', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asMarkdownTables({ markdown: thisCase.given })).toEqual(
        thisCase.expect,
      );
    }),
  );
});
