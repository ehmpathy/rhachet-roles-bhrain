import { asSubagentParentUuid } from './asSubagentParentUuid';

const TEST_CASES = [
  {
    description: 'a subagent file → its parent session uuid',
    given: {
      path: '/p/-home-me-repo/8f278020-ef87-4df2-a7c4-344d83f56cca/subagents/agent-a1.jsonl',
    },
    expect: { parent: '8f278020-ef87-4df2-a7c4-344d83f56cca' },
  },
  {
    description: 'a main transcript → null',
    given: {
      path: '/p/-home-me-repo/8f278020-ef87-4df2-a7c4-344d83f56cca.jsonl',
    },
    expect: { parent: null },
  },
  {
    description: 'a file in a dir merely named like a session → null',
    given: { path: '/p/8f278020-ef87-4df2-a7c4-344d83f56cca/notes.jsonl' },
    expect: { parent: null },
  },
] as const;

describe('asSubagentParentUuid', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asSubagentParentUuid(thisCase.given)).toEqual(
        thisCase.expect.parent,
      );
    }),
  );
});
