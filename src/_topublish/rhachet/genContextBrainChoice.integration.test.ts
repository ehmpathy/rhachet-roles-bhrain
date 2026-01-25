import { given, then, when } from 'test-fns';

import { DEFAULT_BRAIN, genContextBrainChoice } from './genContextBrainChoice';

describe('genContextBrainChoice', () => {
  given('[case1] xai brain', () => {
    when('[t0] genContextBrainChoice called with xai brain', () => {
      then('returns valid ContextBrainChoice', async () => {
        const ctx = await genContextBrainChoice({
          brain: 'xai/grok/code-fast-1',
        });
        expect(ctx.brain.choice).toBeDefined();
        expect(ctx.brain.choice.slug).toEqual('xai/grok/code-fast-1');
        expect(ctx.brain.choice.ask).toBeDefined();
      });
    });
  });

  given('[case2] anthropic brain', () => {
    when('[t0] genContextBrainChoice called with anthropic atom brain', () => {
      then('returns valid ContextBrainChoice with ask method', async () => {
        const ctx = await genContextBrainChoice({ brain: 'claude/sonnet' });
        expect(ctx.brain.choice).toBeDefined();
        expect(ctx.brain.choice.slug).toEqual('claude/sonnet');
        expect(ctx.brain.choice.ask).toBeDefined();
      });
    });

    when('[t1] genContextBrainChoice called with anthropic repl brain', () => {
      then('returns valid ContextBrainChoice with act method', async () => {
        const ctx = await genContextBrainChoice({ brain: 'claude/code' });
        expect(ctx.brain.choice).toBeDefined();
        expect(ctx.brain.choice.slug).toEqual('claude/code');
        expect(ctx.brain.choice.ask).toBeDefined();
        // repls have both ask and act
        expect('act' in ctx.brain.choice).toBe(true);
      });
    });
  });

  given('[case3] openai brain', () => {
    when('[t0] genContextBrainChoice called with openai brain', () => {
      then('returns valid ContextBrainChoice', async () => {
        const ctx = await genContextBrainChoice({ brain: 'openai/gpt/4o' });
        expect(ctx.brain.choice).toBeDefined();
        expect(ctx.brain.choice.slug).toEqual('openai/gpt/4o');
        expect(ctx.brain.choice.ask).toBeDefined();
      });
    });
  });

  given('[case4] default brain', () => {
    when('[t0] genContextBrainChoice called with DEFAULT_BRAIN', () => {
      then('DEFAULT_BRAIN is xai/grok/code-fast-1', () => {
        expect(DEFAULT_BRAIN).toEqual('xai/grok/code-fast-1');
      });

      then('returns valid ContextBrainChoice', async () => {
        const ctx = await genContextBrainChoice({ brain: DEFAULT_BRAIN });
        expect(ctx.brain.choice).toBeDefined();
        expect(ctx.brain.choice.slug).toEqual(DEFAULT_BRAIN);
      });
    });
  });
});
