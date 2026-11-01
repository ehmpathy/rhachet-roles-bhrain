import { asToolInvocation } from './asToolInvocation';

/**
 * .what = data-driven cases for the pure stdin-invocation cast
 * .why = each outcome (a tool, an empty payload, a payload the guard cannot read)
 *        is pure logic and belongs under unit coverage
 */
const TEST_CASES: Array<{
  description: string;
  raw: string;
  expect: ReturnType<typeof asToolInvocation>;
}> = [
  {
    description: 'casts a valid Write invocation',
    raw: JSON.stringify({
      tool_name: 'Write',
      tool_input: { file_path: '/x/memory/MEMORY.md' },
    }),
    expect: {
      tool: {
        name: 'Write',
        input: { file_path: '/x/memory/MEMORY.md', command: null },
        cwd: null,
      },
      unjudgeable: null,
    },
  },
  {
    description: 'casts a Bash invocation with no tool_input to null inputs',
    raw: JSON.stringify({ tool_name: 'Bash' }),
    expect: {
      tool: {
        name: 'Bash',
        input: { file_path: null, command: null },
        cwd: null,
      },
      unjudgeable: null,
    },
  },
  {
    description: 'carries the harness cwd',
    raw: JSON.stringify({
      tool_name: 'Bash',
      tool_input: { command: 'ls' },
      cwd: '/home/agent/repo',
    }),
    expect: {
      tool: {
        name: 'Bash',
        input: { file_path: null, command: 'ls' },
        cwd: '/home/agent/repo',
      },
      unjudgeable: null,
    },
  },
  {
    description: 'empty stdin is no call to judge',
    raw: '',
    expect: { tool: null, unjudgeable: null },
  },
  {
    description: 'blank stdin is no call to judge',
    raw: '   ',
    expect: { tool: null, unjudgeable: null },
  },
  {
    description: 'malformed json names its blind spot',
    raw: '{ not json',
    expect: { tool: null, unjudgeable: 'tool payload is not json' },
  },
  {
    description: 'an empty object names its blind spot',
    raw: '{}',
    expect: { tool: null, unjudgeable: 'tool payload has no tool_name' },
  },
  {
    description: 'an array names its blind spot',
    raw: '[]',
    expect: { tool: null, unjudgeable: 'tool payload has no tool_name' },
  },
  {
    description: 'a json null names its blind spot',
    raw: 'null',
    expect: { tool: null, unjudgeable: 'tool payload has no tool_name' },
  },
  {
    description: 'a renamed field names its blind spot',
    raw: JSON.stringify({ toolName: 'Bash', tool_input: { command: 'ls' } }),
    expect: { tool: null, unjudgeable: 'tool payload has no tool_name' },
  },
];

describe('asToolInvocation', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asToolInvocation({ raw: thisCase.raw })).toEqual(thisCase.expect);
    }),
  );
});
