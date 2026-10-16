import { asConversationVar } from './asConversationVar';

const TEST_CASES = [
  {
    description: 'renders no files as an empty token',
    given: { files: [], repoRoot: '/repo' },
    expect: { output: '' },
  },
  {
    description: 'renders each file root-relative, comma-joined',
    given: {
      files: [
        '/repo/.behavior/x/.reviews/peer/a.given.md',
        '/repo/.behavior/x/.reviews/peer/a.taken.md',
      ],
      repoRoot: '/repo',
    },
    expect: {
      output:
        '.behavior/x/.reviews/peer/a.given.md,.behavior/x/.reviews/peer/a.taken.md',
    },
  },
];

describe('asConversationVar', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asConversationVar(thisCase.given)).toEqual(thisCase.expect.output);
    }),
  );
});
