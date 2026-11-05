import { isHumanTurn } from './isHumanTurn';

const TEST_CASES: {
  description: string;
  given: Parameters<typeof isHumanTurn>[0];
  expect: boolean;
}[] = [
  {
    description: 'a user entry with string content → a human',
    given: { type: 'user', message: { content: 'hello' } },
    expect: true,
  },
  {
    description: 'a user entry with a text block → a human',
    given: {
      type: 'user',
      message: { content: [{ type: 'text', text: 'hello' }] },
    },
    expect: true,
  },
  {
    description: 'an assistant entry → never a human',
    given: { type: 'assistant', message: { content: 'hi' } },
    expect: false,
  },
  {
    description:
      'a meta user entry (a hook replay) → never a human, else a nudge silences itself',
    given: { type: 'user', isMeta: true, message: { content: 'nudge' } },
    expect: false,
  },
  {
    description: 'a sidechain user entry → never a human',
    given: { type: 'user', isSidechain: true, message: { content: 'task' } },
    expect: false,
  },
  {
    description: 'the compaction summary → never a human',
    given: {
      type: 'user',
      isCompactSummary: true,
      message: { content: 'summary' },
    },
    expect: false,
  },
  {
    description: 'a tool result → the harness, never a human',
    given: {
      type: 'user',
      message: { content: [{ type: 'tool_result', content: 'ok' }] },
    },
    expect: false,
  },
  {
    description: 'a user entry with no content → never a human',
    given: { type: 'user' },
    expect: false,
  },
];

describe('isHumanTurn', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isHumanTurn(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
