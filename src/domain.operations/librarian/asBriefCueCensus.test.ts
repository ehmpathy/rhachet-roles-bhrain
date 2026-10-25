import { given, then, when } from 'test-fns';

import { asBriefCueCensus } from './asBriefCueCensus';

describe('asBriefCueCensus', () => {
  given('[case1] a brief of two cue lines and one argument line', () => {
    const text = '# head\n- a bullet\nthe reason this holds';

    when('[t0] the census is taken', () => {
      const census = asBriefCueCensus({ text });

      then('the cue lines are the header and the bullet', () => {
        expect(census.cueLines).toEqual(['# head', '- a bullet']);
      });

      then('each line costs its length plus a newline', () => {
        // '# head' = 6 + 1, '- a bullet' = 10 + 1
        expect(census.cueChars).toEqual(18);
        // 'the reason this holds' = 21 + 1
        expect(census.argChars).toEqual(22);
      });
    });
  });

  given('[case2] a brief with blank lines', () => {
    when('[t0] the census is taken', () => {
      const census = asBriefCueCensus({ text: '\n\n- a\n\n\nprose\n\n' });

      then('a blank line costs naught', () => {
        expect(census.cueChars).toEqual(4);
        expect(census.argChars).toEqual(6);
      });
    });
  });

  given('[case3] a brief with a fenced shape', () => {
    when('[t0] the census is taken', () => {
      const census = asBriefCueCensus({
        text: ['```', 'plain prose in a fence', '```'].join('\n'),
      });

      then('the fence marks and the lines inside are cue', () => {
        expect(census.argChars).toEqual(0);
        expect(census.cueLines).toEqual([
          '```',
          'plain prose in a fence',
          '```',
        ]);
      });
    });
  });

  given('[case4] an empty brief', () => {
    when('[t0] the census is taken', () => {
      then('both shares are zero and no cue line is listed', () => {
        expect(asBriefCueCensus({ text: '' })).toEqual({
          cueChars: 0,
          argChars: 0,
          cueLines: [],
        });
      });
    });
  });
});
