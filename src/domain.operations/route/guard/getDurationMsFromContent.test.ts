import { given, then, when } from 'test-fns';

import { getDurationMsFromContent } from './getDurationMsFromContent';

describe('getDurationMsFromContent', () => {
  given('[case1] content with a total duration line', () => {
    const content = '└─ total: 51455ms';

    when('[t0] parsed', () => {
      then('it returns the numeric milliseconds', () => {
        const durationMs = getDurationMsFromContent({ content });
        expect(durationMs).toEqual(51455);
      });
    });
  });

  given('[case2] content with the duration embedded in a larger tree', () => {
    const content = [
      '   ✨ metrics.realized',
      '      └─ time',
      '         └─ total: 24238ms',
    ].join('\n');

    when('[t0] parsed', () => {
      then('it extracts the milliseconds', () => {
        const durationMs = getDurationMsFromContent({ content });
        expect(durationMs).toEqual(24238);
      });
    });
  });

  given('[case3] content with no duration line', () => {
    const content = 'looks solid, ship it';

    when('[t0] parsed', () => {
      then('it returns null', () => {
        const durationMs = getDurationMsFromContent({ content });
        expect(durationMs).toBeNull();
      });
    });
  });

  given('[case4] empty content', () => {
    const content = '';

    when('[t0] parsed', () => {
      then('it returns null', () => {
        const durationMs = getDurationMsFromContent({ content });
        expect(durationMs).toBeNull();
      });
    });
  });
});
