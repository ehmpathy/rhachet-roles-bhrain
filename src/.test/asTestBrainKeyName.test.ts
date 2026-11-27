import { getError } from 'test-fns';

import { asTestBrainKeyName } from './asTestBrainKeyName';
import { DEFAULT_TEST_BRAIN } from './genTestBrainContext';

const TEST_CASES = [
  {
    description: 'the default test brain needs the openrouter key',
    given: { brain: DEFAULT_TEST_BRAIN },
    expect: { output: 'OPENROUTER_API_KEY' },
  },
  {
    description: 'an anthropic brain needs the anthropic key',
    given: { brain: 'anthropic/claude/sonnet' },
    expect: { output: 'ANTHROPIC_API_KEY' },
  },
  {
    description: 'an openai brain needs the openai key',
    given: { brain: 'openai/gpt/mini' },
    expect: { output: 'OPENAI_API_KEY' },
  },
];

describe('asTestBrainKeyName', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asTestBrainKeyName(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );

  test('an unmapped provider fails loud with the slug', async () => {
    const error = await getError(async () =>
      asTestBrainKeyName({ brain: 'mystery/model' }),
    );
    expect(error.message).toContain('no test key is mapped');
    expect(error.message).toContain('mystery/model');
  });
});
