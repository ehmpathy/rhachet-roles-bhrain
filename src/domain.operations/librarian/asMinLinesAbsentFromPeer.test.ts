import { asMinLinesAbsentFromPeer } from './asMinLinesAbsentFromPeer';

/**
 * .what = data-driven cases for the min-to-peer line census
 * .why = the census gates a move of text out of a min, so each rule for which line counts is
 *        pinned: trim, blank, fence mark, table separator, and set membership
 */
const TEST_CASES: {
  description: string;
  given: { minText: string; peerText: string };
  expect: { total: number; absent: string[] };
}[] = [
  {
    description: 'every min line sits in the peer: none absent',
    given: {
      minText: '# a\n- one\n- two',
      peerText: '# a\n- one\n- two\n- three',
    },
    expect: { total: 3, absent: [] },
  },
  {
    description: 'a min line the peer lacks is absent, in the order typed',
    given: { minText: '# a\n- one\n- two\n- four', peerText: '# a\n- one' },
    expect: { total: 4, absent: ['- two', '- four'] },
  },
  {
    description:
      'lines are compared trimmed, so an indent does not make a line absent',
    given: { minText: '  - one\n- two  ', peerText: '- one\n   - two' },
    expect: { total: 2, absent: [] },
  },
  {
    description: 'a blank line does not count',
    given: { minText: '\n\n- one\n   \n', peerText: '- one' },
    expect: { total: 1, absent: [] },
  },
  {
    description: 'a fence mark does not count, with or without a language tag',
    given: { minText: '```ts\n- one\n```', peerText: '- one' },
    expect: { total: 1, absent: [] },
  },
  {
    description: 'a table separator row does not count',
    given: {
      minText: '| a | b |\n|---|:-:|\n| 1 | 2 |',
      peerText: '| a | b |\n| 1 | 2 |',
    },
    expect: { total: 2, absent: [] },
  },
  {
    description: 'a table data row absent from the peer is absent',
    given: {
      minText: '| a | b |\n|---|---|\n| 1 | 2 |',
      peerText: '| a | b |',
    },
    expect: { total: 2, absent: ['| 1 | 2 |'] },
  },
  {
    description: 'an empty min has no lines to count',
    given: { minText: '', peerText: '- one' },
    expect: { total: 0, absent: [] },
  },
  {
    description: 'an empty peer leaves every counted min line absent',
    given: { minText: '- one\n- two', peerText: '' },
    expect: { total: 2, absent: ['- one', '- two'] },
  },
];

describe('asMinLinesAbsentFromPeer', () => {
  TEST_CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      expect(asMinLinesAbsentFromPeer(thisCase.given)).toEqual(thisCase.expect);
    });
  });
});
