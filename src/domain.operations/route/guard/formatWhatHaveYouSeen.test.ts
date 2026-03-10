import { given, then, when } from 'test-fns';

import { formatWhatHaveYouSeen } from './formatWhatHaveYouSeen';

describe('formatWhatHaveYouSeen', () => {
  given('[case1] output structure matches vision', () => {
    const articulationPath =
      '.behavior/v2026_03_08.feature/review/self/3.1.blueprint.design.md';

    when('[t0] formatWhatHaveYouSeen called', () => {
      then('contains fallen leaf header', () => {
        const output = formatWhatHaveYouSeen({ articulationPath });
        expect(output).toContain('🍂 what have you seen?');
      });

      then('contains silence lines', () => {
        const output = formatWhatHaveYouSeen({ articulationPath });
        expect(output).toContain('├─ ...');
      });

      then('contains articulation absent message', () => {
        const output = formatWhatHaveYouSeen({ articulationPath });
        expect(output).toContain('the articulation is absent');
      });

      then('contains the articulation path', () => {
        const output = formatWhatHaveYouSeen({ articulationPath });
        expect(output).toContain(articulationPath);
      });

      then('contains promise without words message', () => {
        const output = formatWhatHaveYouSeen({ articulationPath });
        expect(output).toContain('a promise without words');
        expect(output).toContain('is not a promise');
        expect(output).toContain('it is a daydream');
      });

      then('contains the way asks section', () => {
        const output = formatWhatHaveYouSeen({ articulationPath });
        expect(output).toContain('the way asks');
        expect(output).toContain('write what you found');
        expect(output).toContain("write what you didn't");
        expect(output).toContain('then return 🍵');
      });

      then('snapshot matches vision', () => {
        const output = formatWhatHaveYouSeen({ articulationPath });
        expect(output).toMatchSnapshot();
      });
    });
  });
});
