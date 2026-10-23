import { asToolLabel } from './asToolLabel';

const TEST_CASES = [
  {
    description: 'a non-Bash tool is labeled by its name',
    given: { name: 'Read', command: null },
    expect: { label: 'Read' },
  },
  {
    description: 'an rhx call is labeled by its skill',
    given: { name: 'Bash', command: 'rhx git.repo.test --what unit' },
    expect: { label: 'Bash · git.repo.test' },
  },
  {
    description: 'an rhx call after a pipe is labeled by its skill',
    given: {
      name: 'Bash',
      command: "printf 'x' | rhx git.commit.set -m @stdin",
    },
    expect: { label: 'Bash · git.commit.set' },
  },
  {
    description: 'an rhachet run call is labeled by its skill',
    given: {
      name: 'Bash',
      command: 'npx rhachet run --skill sedreplace --old a --new b',
    },
    expect: { label: 'Bash · sedreplace' },
  },
  {
    description: 'any other command is labeled by its first word',
    given: { name: 'Bash', command: 'cat src/index.ts' },
    expect: { label: 'Bash · cat' },
  },
];

describe('asToolLabel', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asToolLabel(thisCase.given)).toEqual(thisCase.expect.label);
    }),
  );
});
