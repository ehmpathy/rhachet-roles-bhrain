import { given, then, when } from 'test-fns';

import { formatWhatsTheRush } from './formatWhatsTheRush';

describe('formatWhatsTheRush', () => {
  given('[case1] output structure matches vision', () => {
    when('[t0] formatWhatsTheRush called', () => {
      then('contains fallen leaf header', () => {
        const output = formatWhatsTheRush();
        expect(output).toContain('🍂 what is the rush?');
      });

      then('contains silence lines', () => {
        const output = formatWhatsTheRush();
        // three dots on their own line for pause/silence
        expect(output).toContain('├─ ...');
      });

      then('contains what does haste cost', () => {
        const output = formatWhatsTheRush();
        expect(output).toContain('what does haste cost?');
      });

      then('contains burden reflections', () => {
        const output = formatWhatsTheRush();
        expect(output).toContain('what you miss, they must find');
        expect(output).toContain('minutes saved, hours spent');
        expect(output).toContain('your haste, their burden');
      });

      then('contains opportunity reflections', () => {
        const output = formatWhatsTheRush();
        expect(output).toContain('each review is an opportunity');
        expect(output).toContain('a chance to find a deeper truth');
        expect(output).toContain('not one to squander');
      });

      then('contains trust the way section', () => {
        const output = formatWhatsTheRush();
        expect(output).toContain('trust the way');
        expect(output).toContain('be true to the review 🍵');
      });

      then('snapshot matches vision', () => {
        const output = formatWhatsTheRush();
        expect(output).toMatchSnapshot();
      });
    });
  });
});
