import { asTranscriptSessionStats } from './asTranscriptSessionStats';

/**
 * .note = fixtures order events by date alone: a time of day is forbidden in a tracked file,
 *         and the fold compares stamps as strings, so a date sorts the same way a stamp does
 */
const TEST_CASES = [
  {
    description: 'an empty transcript has no activity and no prompt',
    given: { entries: [] },
    expect: {
      output: {
        entries: 0,
        since: null,
        until: null,
        prompts: 0,
        promptLast: null,
      },
    },
  },
  {
    description:
      'the last human prompt is the newest typed turn, not the newest write',
    given: {
      entries: [
        {
          type: 'user',
          timestamp: '2026-11-01',
          message: { content: 'first ask' },
        },
        {
          type: 'assistant',
          timestamp: '2026-11-02',
          message: { content: [] },
        },
        {
          type: 'user',
          timestamp: '2026-11-03',
          message: { content: [{ type: 'text', text: 'second ask' }] },
        },
        {
          type: 'assistant',
          timestamp: '2026-11-04',
          message: { content: [] },
        },
      ],
    },
    expect: {
      output: {
        entries: 4,
        since: '2026-11-01',
        until: '2026-11-04',
        prompts: 2,
        promptLast: { at: '2026-11-03', text: 'second ask' },
      },
    },
  },
  {
    description:
      'hook output, tool results, subagent turns, and the compaction summary are no prompt',
    given: {
      entries: [
        {
          type: 'user',
          timestamp: '2026-11-01',
          message: { content: 'the real ask' },
        },
        {
          type: 'user',
          isMeta: true,
          timestamp: '2026-11-02',
          message: { content: 'hook said' },
        },
        {
          type: 'user',
          timestamp: '2026-11-03',
          message: { content: [{ type: 'tool_result', content: 'ok' }] },
        },
        {
          type: 'user',
          isSidechain: true,
          timestamp: '2026-11-04',
          message: { content: 'sub' },
        },
        {
          type: 'user',
          isCompactSummary: true,
          timestamp: '2026-11-05',
          message: { content: 'summary' },
        },
      ],
    },
    expect: {
      output: {
        entries: 5,
        since: '2026-11-01',
        until: '2026-11-05',
        prompts: 1,
        promptLast: { at: '2026-11-01', text: 'the real ask' },
      },
    },
  },
  {
    description:
      'a message the human sends mid-turn counts, and can be the last prompt',
    given: {
      entries: [
        {
          type: 'user',
          timestamp: '2026-11-01',
          message: { content: 'is the vision up to date?' },
        },
        {
          type: 'queue-operation',
          operation: 'enqueue',
          timestamp: '2026-11-02',
          content: 'seems like not',
        },
        {
          type: 'attachment',
          timestamp: '2026-11-02',
          attachment: {
            type: 'queued_command',
            prompt: 'seems like not',
            commandMode: 'prompt',
            origin: { kind: 'human' },
            humanTurn: true,
          },
        },
        {
          type: 'attachment',
          timestamp: '2026-11-03',
          attachment: {
            type: 'queued_command',
            prompt: 'a task notification',
            origin: { kind: 'task' },
            humanTurn: false,
          },
        },
      ],
    },
    expect: {
      output: {
        entries: 4,
        since: '2026-11-01',
        until: '2026-11-03',
        prompts: 2,
        promptLast: { at: '2026-11-02', text: 'seems like not' },
      },
    },
  },
  {
    description: 'a prompt with no timestamp counts, but cannot be the last',
    given: {
      entries: [
        {
          type: 'user',
          timestamp: '2026-11-01',
          message: { content: 'dated' },
        },
        { type: 'user', message: { content: 'undated' } },
      ],
    },
    expect: {
      output: {
        entries: 2,
        since: '2026-11-01',
        until: '2026-11-01',
        prompts: 2,
        promptLast: { at: '2026-11-01', text: 'dated' },
      },
    },
  },
];

describe('asTranscriptSessionStats', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asTranscriptSessionStats({ entries: thisCase.given.entries }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
