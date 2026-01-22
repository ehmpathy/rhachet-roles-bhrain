import { BadRequestError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import {
  DEFAULT_BRAIN,
  genContextBrainChoice,
  getAvailableBrainSlugs,
} from './genContextBrainChoice';

describe('genContextBrainChoice', () => {
  // note: valid brain refs are tested in genContextBrainChoice.integration.test.ts
  // since they require real API keys to instantiate brain clients

  given('[case1] an invalid brain ref', () => {
    when('[t0] brain slug does not exist', () => {
      then('throws BadRequestError with available brains list', async () => {
        const error = await getError(
          genContextBrainChoice({ brain: 'nonexistent/brain' }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('brain not found: nonexistent/brain');
        expect(error.message).toContain('available brains:');
        expect(error.message).toContain('xai/grok/code-fast-1');
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

      then('throws BadRequestError with env var name', async () => {
        const error = await getError(
          genContextBrainChoice({ brain: 'xai/grok/code-fast-1' }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('api key not found for provider: xai');
        expect(error.message).toContain('XAI_API_KEY');
      });
    });

    when('[t1] claude brain requested but ANTHROPIC_API_KEY absent', () => {
      const envBefore = process.env.ANTHROPIC_API_KEY;
      beforeEach(() => {
        delete process.env.ANTHROPIC_API_KEY;
      });
      afterEach(() => {
        if (envBefore) process.env.ANTHROPIC_API_KEY = envBefore;
      });

      then('throws BadRequestError with env var name', async () => {
        const error = await getError(
          genContextBrainChoice({ brain: 'claude/sonnet' }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain(
          'api key not found for provider: claude',
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

      then('throws BadRequestError with env var name', async () => {
        const error = await getError(
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

describe('getAvailableBrainSlugs', () => {
  given('[case1] brain packages loaded', () => {
    when('[t0] getAvailableBrainSlugs called', () => {
      then('returns array of slug strings', () => {
        const slugs = getAvailableBrainSlugs();
        expect(Array.isArray(slugs)).toBe(true);
        expect(slugs.length).toBeGreaterThan(0);
      });

      then('includes xai brains', () => {
        const slugs = getAvailableBrainSlugs();
        expect(slugs).toContain('xai/grok/code-fast-1');
      });

      then('includes anthropic brains', () => {
        const slugs = getAvailableBrainSlugs();
        expect(slugs).toContain('claude/sonnet');
        expect(slugs).toContain('claude/code');
      });

      then('includes openai brains', () => {
        const slugs = getAvailableBrainSlugs();
        expect(slugs).toContain('openai/gpt/4o');
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
