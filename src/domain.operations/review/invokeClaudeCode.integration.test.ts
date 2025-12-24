import { given, then, when } from 'test-fns';

import { invokeClaudeCode } from './invokeClaudeCode';

/**
 * .note = these tests invoke the real claude-code cli
 * .note = skip in CI to avoid cost and external dependencies
 */
const RUN_REAL_CLI_TESTS = process.env.TEST_REAL_CLI === 'true';

describe('invokeClaudeCode', () => {
  given('[case1] a simple prompt', () => {
    when('[t0] claude-code is invoked', () => {
      (RUN_REAL_CLI_TESTS ? it : it.skip)(
        'then: returns response with review content',
        async () => {
          const result = await invokeClaudeCode({
            prompt: 'respond with exactly: "hello world"',
          });

          expect(result.response).toBeDefined();
          expect(typeof result.review).toBe('string');
          expect(result.review.length).toBeGreaterThan(0);
        },
        30000, // 30s timeout for cli invocation
      );
    });
  });

  given('[case2] cli not available', () => {
    when('[t0] module is imported', () => {
      then('function is exported', () => {
        expect(typeof invokeClaudeCode).toBe('function');
      });
    });
  });
});
