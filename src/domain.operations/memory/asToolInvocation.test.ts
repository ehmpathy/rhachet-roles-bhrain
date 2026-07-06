import { asToolInvocation } from './asToolInvocation';

/**
 * .what = unit cases for the pure stdin-invocation cast
 * .why = the empty/malformed fail-open branches are pure logic and belong under
 *        unit coverage (the integration suite only exercises valid JSON)
 */
describe('asToolInvocation', () => {
  test('casts a valid Write invocation', () => {
    const result = asToolInvocation({
      raw: JSON.stringify({
        tool_name: 'Write',
        tool_input: { file_path: '/x/memory/MEMORY.md' },
      }),
    });
    expect(result).toEqual({
      tool: {
        name: 'Write',
        input: { file_path: '/x/memory/MEMORY.md', command: null },
      },
    });
  });

  test('yields a null tool on empty stdin (fail-open)', () => {
    expect(asToolInvocation({ raw: '' })).toEqual({ tool: null });
    expect(asToolInvocation({ raw: '   ' })).toEqual({ tool: null });
  });

  test('yields a null tool on malformed JSON (fail-open)', () => {
    expect(asToolInvocation({ raw: '{ not json' })).toEqual({ tool: null });
  });

  test('defaults absent fields to empty name + null tool inputs', () => {
    const result = asToolInvocation({ raw: '{}' });
    expect(result).toEqual({
      tool: {
        name: '',
        input: { file_path: null, command: null },
      },
    });
  });
});
