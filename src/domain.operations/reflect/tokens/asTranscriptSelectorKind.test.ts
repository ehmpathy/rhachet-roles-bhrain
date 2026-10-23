import { asTranscriptSelectorKind } from './asTranscriptSelectorKind';

const TEST_CASES = [
  {
    description: '@current → the live session',
    given: { selector: '@current' },
    expect: { kind: 'current' },
  },
  {
    description: 'a bare session uuid → a uuid lookup',
    given: { selector: '8f278020-ef87-4df2-a7c4-344d83f56cca' },
    expect: { kind: 'uuid' },
  },
  {
    description: 'a quoted glob → a corpus',
    given: { selector: '~/.claude/projects/-home-me-repo/*.jsonl' },
    expect: { kind: 'glob' },
  },
  {
    description: 'a brace glob → a corpus',
    given: { selector: 'sessions/{a,b}.jsonl' },
    expect: { kind: 'glob' },
  },
  {
    description: 'a plain file path → a path',
    given: { selector: '/home/me/session.jsonl' },
    expect: { kind: 'path' },
  },
  {
    description: 'a uuid inside a path → still a path, never a bare uuid',
    given: { selector: './8f278020-ef87-4df2-a7c4-344d83f56cca.jsonl' },
    expect: { kind: 'path' },
  },
] as const;

describe('asTranscriptSelectorKind', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asTranscriptSelectorKind(thisCase.given)).toEqual(
        thisCase.expect.kind,
      );
    }),
  );
});
