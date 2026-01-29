import { BadRequestError } from 'helpful-errors';
import { BrainChoiceNotFoundError } from 'rhachet';
import { getError, given, then, when } from 'test-fns';

import { DEFAULT_BRAIN, genContextBrainChoice } from './genContextBrainChoice';

describe('genContextBrainChoice', () => {
  // note: valid brain refs are tested in genContextBrainChoice.integration.test.ts
  // since they require real API keys to instantiate brain clients

  given('[case1] an invalid brain ref', () => {
    when('[t0] brain slug does not exist', () => {
      then('throws BrainChoiceNotFoundError with available brains list', () => {
        const error = getError(() =>
          genContextBrainChoice({ brain: 'nonexistent/brain' }),
        );
        expect(error).toBeInstanceOf(BrainChoiceNotFoundError);
        expect(error.message).toContain('brain not found: nonexistent/brain');
      });
    });
  });

  given('[case2] api key validation', () => {
    when('[t0] xai brain requested but XAI_API_KEY absent', () => {
      const envBefore = process.env.XAI_API_KEY;
      beforeEach(() => {
        delete process.env.XAI_API_KEY;
      });
      afterEach(() => {
        if (envBefore) process.env.XAI_API_KEY = envBefore;
      });

      then('throws BadRequestError with env var name', () => {
        const error = getError(() =>
          genContextBrainChoice({ brain: 'xai/grok/code-fast-1' }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('api key not found for provider: xai');
        expect(error.message).toContain('XAI_API_KEY');
      });
    });

    when('[t1] anthropic brain requested but ANTHROPIC_API_KEY absent', () => {
      const envBefore = process.env.ANTHROPIC_API_KEY;
      beforeEach(() => {
        delete process.env.ANTHROPIC_API_KEY;
      });
      afterEach(() => {
        if (envBefore) process.env.ANTHROPIC_API_KEY = envBefore;
      });

      then('throws BadRequestError with env var name', () => {
        const error = getError(() =>
          genContextBrainChoice({ brain: 'anthropic/claude/sonnet' }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain(
          'api key not found for provider: anthropic',
        );
        expect(error.message).toContain('ANTHROPIC_API_KEY');
      });
    });

    when('[t2] openai brain requested but OPENAI_API_KEY absent', () => {
      const envBefore = process.env.OPENAI_API_KEY;
      beforeEach(() => {
        delete process.env.OPENAI_API_KEY;
      });
      afterEach(() => {
        if (envBefore) process.env.OPENAI_API_KEY = envBefore;
      });

      then('throws BadRequestError with env var name', () => {
        const error = getError(() =>
          genContextBrainChoice({ brain: 'openai/gpt/4o' }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain(
          'api key not found for provider: openai',
        );
        expect(error.message).toContain('OPENAI_API_KEY');
      });
    });
  });
});

describe('DEFAULT_BRAIN', () => {
  given('[case1] default brain constant', () => {
    when('[t0] DEFAULT_BRAIN accessed', () => {
      then('is xai/grok/code-fast-1', () => {
        expect(DEFAULT_BRAIN).toEqual('xai/grok/code-fast-1');
      });
    });
  });
});
