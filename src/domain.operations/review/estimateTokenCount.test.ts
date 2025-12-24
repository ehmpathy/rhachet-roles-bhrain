import { given, then, when } from 'test-fns';

import { estimateTokenCount } from './estimateTokenCount';

describe('estimateTokenCount', () => {
  given('[case1] content strings', () => {
    when('[t0] empty string', () => {
      then('returns 0', () => {
        const result = estimateTokenCount({ content: '' });
        expect(result).toEqual(0);
      });
    });

    when('[t1] simple text', () => {
      then('estimates tokens proportional to length', () => {
        const short = estimateTokenCount({ content: 'hello world' });
        const long = estimateTokenCount({
          content: 'hello world '.repeat(100),
        });
        expect(long).toBeGreaterThan(short);
      });

      then('returns positive number', () => {
        const result = estimateTokenCount({ content: 'hello world' });
        expect(result).toBeGreaterThan(0);
      });
    });

    when('[t2] code with special characters', () => {
      then('accounts for tokenization of symbols', () => {
        const code = 'const x = () => { return { a: 1, b: 2 }; };';
        const estimate = estimateTokenCount({ content: code });
        expect(estimate).toBeGreaterThan(0);
        expect(estimate).toBeLessThan(code.length); // tokens < chars for code
      });
    });

    when('[t3] long content', () => {
      then('scales approximately linearly', () => {
        const base = 'const x = 1;\n';
        const oneK = estimateTokenCount({ content: base.repeat(100) });
        const twoK = estimateTokenCount({ content: base.repeat(200) });

        // should be roughly 2x (within tolerance)
        const ratio = twoK / oneK;
        expect(ratio).toBeGreaterThan(1.8);
        expect(ratio).toBeLessThan(2.2);
      });
    });
  });
});
