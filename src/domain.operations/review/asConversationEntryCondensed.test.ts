import { asConversationEntryCondensed } from './asConversationEntryCondensed';

const PATH_GIVEN =
  '.behavior/demo/.reviews/peer/1.vision._.review.i003.abc.r002._.given.by_peer.mech.report.md';
const PATH_TAKEN =
  '.behavior/demo/.reviews/peer/1.vision._.review.i003.abc.r002._.taken.by_self.mech.md';

const STDOUT_MALFUNCTION = [
  '🐢 bummer dude...',
  '',
  'review exited 1 before it stated a count',
  'x'.repeat(4000),
].join('\n');

const STDOUT_REFUSAL = [
  '✋ ConstraintError: prompt exceeds 75% of context window',
  '   ├─ locus',
  'y'.repeat(4000),
].join('\n');

const TEST_CASES = [
  {
    description: 'a readable verdict rides whole',
    given: {
      entry: {
        path: PATH_GIVEN,
        content: '# blocker.1: x\n\n1 blocker\n0 nitpicks\n',
      },
    },
    expect: { condensed: false, contains: '# blocker.1: x' },
  },
  {
    description: 'a malfunction given condenses to one line',
    given: { entry: { path: PATH_GIVEN, content: STDOUT_MALFUNCTION } },
    expect: { condensed: true, contains: 'malfunction — no verdict read' },
  },
  {
    description: 'a refusal given condenses to one line that names its cause',
    given: { entry: { path: PATH_GIVEN, content: STDOUT_REFUSAL } },
    expect: {
      condensed: true,
      contains: 'refused — prompt exceeds 75% of context window',
    },
  },
  {
    description:
      'an unreadable given that names a concern rides whole, so no argument is dropped',
    given: {
      entry: {
        path: PATH_GIVEN,
        content: '# blocker.1: the cache key is unique per call\n(cut off)',
      },
    },
    expect: { condensed: false, contains: 'the cache key is unique per call' },
  },
  {
    description: 'a taken rides whole, however it reads',
    given: { entry: { path: PATH_TAKEN, content: STDOUT_MALFUNCTION } },
    expect: { condensed: false, contains: 'review exited 1' },
  },
];

describe('asConversationEntryCondensed', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = asConversationEntryCondensed(thisCase.given);
      expect(output.path).toEqual(thisCase.given.entry.path);
      expect(output.content).toContain(thisCase.expect.contains);
      if (thisCase.expect.condensed) {
        expect(output.content.length).toBeLessThan(200);
        expect(output.content).toContain(
          `its ${thisCase.given.entry.content.length} chars`,
        );
      }
      if (!thisCase.expect.condensed)
        expect(output.content).toEqual(thisCase.given.entry.content);
    }),
  );

  test('the condensed lines, as a reviewer reads them', () => {
    expect(
      [STDOUT_MALFUNCTION, STDOUT_REFUSAL].map(
        (content) =>
          asConversationEntryCondensed({ entry: { path: PATH_GIVEN, content } })
            .content,
      ),
    ).toMatchSnapshot();
  });
});
