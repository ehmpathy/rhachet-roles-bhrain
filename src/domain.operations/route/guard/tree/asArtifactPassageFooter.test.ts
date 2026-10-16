import { asArtifactPassageFooter } from './asArtifactPassageFooter';

const TEST_CASES: {
  description: string;
  given: { exitCode: number };
  expect: ReturnType<typeof asArtifactPassageFooter>;
}[] = [
  {
    description: 'a clean exit owes no passage footer',
    given: { exitCode: 0 },
    expect: null,
  },
  {
    description: 'exit 2 is a constraint the caller fixes — ✋',
    given: { exitCode: 2 },
    expect: {
      blockReason: 'blocked by constraints',
      exitCode: 2,
      exitEmoji: '✋',
    },
  },
  {
    description: 'exit 1 is a malfunction the system fixes — 💥',
    given: { exitCode: 1 },
    expect: {
      blockReason: 'blocked by malfunction',
      exitCode: 1,
      exitEmoji: '💥',
    },
  },
  {
    description: 'any other nonzero exit reads as a malfunction, never a pass',
    given: { exitCode: 137 },
    expect: {
      blockReason: 'blocked by malfunction',
      exitCode: 137,
      exitEmoji: '💥',
    },
  },
];

describe('asArtifactPassageFooter', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asArtifactPassageFooter(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
