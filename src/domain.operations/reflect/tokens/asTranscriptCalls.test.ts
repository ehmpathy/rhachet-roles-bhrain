import { asTranscriptCalls } from './asTranscriptCalls';
import type { TranscriptThread } from './genTranscriptCallFold';
import type { TranscriptRecord } from './isTranscriptRecord';

/**
 * .what = one assistant record with a usage block
 */
const genAssistant = (input: {
  requestId: string;
  model?: string;
  output: number;
  isSidechain?: boolean;
  cacheRead?: number;
}): TranscriptRecord => ({
  type: 'assistant',
  isSidechain: input.isSidechain ?? false,
  requestId: input.requestId,
  message: {
    model: input.model ?? 'claude-demo',
    usage: {
      input_tokens: 1,
      cache_read_input_tokens: input.cacheRead ?? 100,
      cache_creation_input_tokens: 10,
      output_tokens: input.output,
    },
    content: [{ type: 'text', text: 'ok' }],
  },
});

const COMPACTION: TranscriptRecord = {
  type: 'system',
  subtype: 'compact_boundary',
};

const TEST_CASES: {
  description: string;
  given: { records: TranscriptRecord[]; thread?: TranscriptThread };
  expect: {
    requestIds: string[];
    outputs: number[];
    isMainThread: boolean[];
    isAfterCompaction: boolean[];
  };
}[] = [
  {
    description:
      'three records of one request → one call, with the last record usage (never a sum)',
    given: {
      records: [
        genAssistant({ requestId: 'req_1', output: 10 }),
        genAssistant({ requestId: 'req_1', output: 20 }),
        genAssistant({ requestId: 'req_1', output: 30 }),
        genAssistant({ requestId: 'req_2', output: 5 }),
      ],
    },
    expect: {
      requestIds: ['req_1', 'req_2'],
      outputs: [30, 5],
      isMainThread: [true, true],
      isAfterCompaction: [false, false],
    },
  },
  {
    description:
      'a sidechain call in a main transcript → counts in efficiency, never on the main thread',
    given: {
      records: [
        genAssistant({ requestId: 'req_1', output: 10 }),
        genAssistant({ requestId: 'req_side', output: 90, isSidechain: true }),
        genAssistant({ requestId: 'req_side', output: 99, isSidechain: true }),
        genAssistant({ requestId: 'req_2', output: 5 }),
      ],
    },
    expect: {
      requestIds: ['req_1', 'req_side', 'req_2'],
      outputs: [10, 99, 5],
      isMainThread: [true, false, true],
      isAfterCompaction: [false, false, false],
    },
  },
  {
    description:
      'a call to another model → a call for efficiency, but off the main thread',
    given: {
      records: [
        genAssistant({ requestId: 'req_1', output: 10 }),
        genAssistant({
          requestId: 'req_title',
          model: 'claude-small',
          output: 3,
        }),
        genAssistant({ requestId: 'req_2', output: 5 }),
      ],
    },
    expect: {
      requestIds: ['req_1', 'req_title', 'req_2'],
      outputs: [10, 3, 5],
      isMainThread: [true, false, true],
      isAfterCompaction: [false, false, false],
    },
  },
  {
    description:
      'a helper model that outnumbers the main thread in calls, yet holds little context → still off the main thread',
    given: {
      records: [
        genAssistant({
          requestId: 'req_h1',
          model: 'claude-small',
          output: 1,
          cacheRead: 10,
        }),
        genAssistant({ requestId: 'req_1', output: 10, cacheRead: 50_000 }),
        genAssistant({
          requestId: 'req_h2',
          model: 'claude-small',
          output: 1,
          cacheRead: 10,
        }),
        genAssistant({
          requestId: 'req_h3',
          model: 'claude-small',
          output: 1,
          cacheRead: 10,
        }),
      ],
    },
    expect: {
      requestIds: ['req_h1', 'req_1', 'req_h2', 'req_h3'],
      outputs: [1, 10, 1, 1],
      isMainThread: [false, true, false, false],
      isAfterCompaction: [false, false, false, false],
    },
  },
  {
    description: 'a <synthetic> record → no call; it was never metered',
    given: {
      records: [
        genAssistant({ requestId: 'req_1', output: 10 }),
        genAssistant({ requestId: 'req_syn', model: '<synthetic>', output: 0 }),
      ],
    },
    expect: {
      requestIds: ['req_1'],
      outputs: [10],
      isMainThread: [true],
      isAfterCompaction: [false],
    },
  },
  {
    description:
      'a compaction boundary → only the next main-thread call is flagged after it',
    given: {
      records: [
        genAssistant({ requestId: 'req_1', output: 10 }),
        COMPACTION,
        genAssistant({ requestId: 'req_2', output: 5 }),
        genAssistant({ requestId: 'req_3', output: 4 }),
      ],
    },
    expect: {
      requestIds: ['req_1', 'req_2', 'req_3'],
      outputs: [10, 5, 4],
      isMainThread: [true, true, true],
      isAfterCompaction: [false, true, false],
    },
  },
  {
    description:
      'a subagent file → its sidechain records are its own thread, never skipped',
    given: {
      thread: 'subagent',
      records: [
        genAssistant({ requestId: 'req_1', output: 10, isSidechain: true }),
        genAssistant({ requestId: 'req_2', output: 5, isSidechain: true }),
      ],
    },
    expect: {
      requestIds: ['req_1', 'req_2'],
      outputs: [10, 5],
      isMainThread: [true, true],
      isAfterCompaction: [false, false],
    },
  },
];

describe('asTranscriptCalls', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const calls = asTranscriptCalls({
        records: thisCase.given.records,
        thread: thisCase.given.thread ?? 'main',
        path: '<transcript>',
      });
      expect(calls.map((call) => call.requestId)).toEqual(
        thisCase.expect.requestIds,
      );
      expect(calls.map((call) => call.spend.output)).toEqual(
        thisCase.expect.outputs,
      );
      expect(calls.map((call) => call.isMainThread)).toEqual(
        thisCase.expect.isMainThread,
      );
      expect(calls.map((call) => call.isAfterCompaction)).toEqual(
        thisCase.expect.isAfterCompaction,
      );
      expect(calls.map((call) => call.ordinal)).toEqual(
        calls.map((_, index) => index + 1),
      );
    }),
  );

  test('a usage count that is not a number → halts with the field and the request', () => {
    const malformed: TranscriptRecord = {
      type: 'assistant',
      isSidechain: false,
      requestId: 'req_bad',
      message: {
        model: 'claude-demo',
        usage: {
          input_tokens: 1,
          cache_read_input_tokens: 100,
          cache_creation_input_tokens: 10,
          output_tokens: 'ten',
        },
        content: [{ type: 'text', text: 'ok' }],
      },
    };
    expect(() =>
      asTranscriptCalls({
        records: [malformed],
        thread: 'main',
        path: '<transcript>',
      }),
    ).toThrow('malformed usage field');
  });
});
