import { given, then, when } from 'test-fns';

import { asOutputLimitRetryLine } from '@src/domain.operations/review/asOutputLimitRetryLine';
import { MARK_OF_ABSENT } from '@src/domain.operations/review/meter/asFigureHuman';

describe('asOutputLimitRetryLine', () => {
  given('[case1] a runaway whose billed count was reported', () => {
    when('[t0] the retry line renders', () => {
      const line = asOutputLimitRetryLine({
        evidence: {
          provider: 'deepinfra',
          generationId: 'gen-abc123',
          tokensOutput: 131072,
        },
      });

      then('🔴 the billed count carries thousands separators', () => {
        expect(line).toContain('(131,072 output tokens billed,');
      });

      then('the line matches its snapshot', () => {
        expect(line).toMatchSnapshot();
      });
    });
  });

  given('[case2] a runaway that billed exactly one output token', () => {
    when('[t0] the retry line renders', () => {
      const line = asOutputLimitRetryLine({
        evidence: { provider: null, generationId: null, tokensOutput: 1 },
      });

      then('🔴 the noun agrees with the count', () => {
        expect(line).toContain('(1 output token billed,');
      });

      then('the line matches its snapshot', () => {
        expect(line).toMatchSnapshot();
      });
    });
  });

  given('[case3] a runaway whose billed count was not reported', () => {
    when('[t0] the retry line renders', () => {
      const line = asOutputLimitRetryLine({
        evidence: { provider: null, generationId: null, tokensOutput: null },
      });

      then('🔴 the count renders absent, never a bare `?`', () => {
        expect(line).toContain(`(${MARK_OF_ABSENT} output tokens billed,`);
        expect(line).not.toContain('?');
      });

      then('the line matches its snapshot', () => {
        expect(line).toMatchSnapshot();
      });
    });
  });
});
