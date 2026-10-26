import { given, then, when } from 'test-fns';

import { asMinWithWhySectionsMoved } from './asMinWithWhySectionsMoved';

describe('asMinWithWhySectionsMoved', () => {
  given('[case1] a min with an argument-only why section the md holds', () => {
    const mdText = [
      '# rule.x',
      '',
      '## .why',
      'the reason this holds',
      'a second line of reason',
      '',
      '## .the test',
      '- a cue',
    ].join('\n');
    const minText = [
      '# rule.x',
      '## .why',
      'the reason this holds',
      'a second line of reason',
      '## .the test',
      '- a cue',
    ].join('\n');

    when('[t0] the sections are moved', () => {
      const result = asMinWithWhySectionsMoved({ minText, mdText });

      then('the section moved, with its line count', () => {
        expect(result.sectionsMoved).toEqual([
          { header: '## .why', lineCount: 3 },
        ]);
        expect(result.sectionsHeld).toEqual([]);
      });

      then('the next text drops only the section', () => {
        expect(result.textNext).toEqual(
          ['# rule.x', '## .the test', '- a cue'].join('\n'),
        );
      });
    });
  });

  given('[case2] a why section that holds a cue line', () => {
    const minText = [
      '# rule.x',
      '## .why',
      '- a bullet is a cue',
      'prose',
    ].join('\n');
    const mdText = minText;

    when('[t0] the sections are moved', () => {
      const result = asMinWithWhySectionsMoved({ minText, mdText });

      then('the section is held for the cue line', () => {
        expect(result.sectionsHeld).toEqual([
          { header: '## .why', reason: 'a cue line' },
        ]);
        expect(result.sectionsMoved).toEqual([]);
      });

      then('the text is unchanged', () => {
        expect(result.textNext).toEqual(minText);
      });
    });
  });

  given('[case3] a why section with a body line the md lacks', () => {
    const minText = ['# rule.x', '## .why', 'a line only the min holds'].join(
      '\n',
    );
    const mdText = ['# rule.x', '## .why', 'some other line'].join('\n');

    when('[t0] the sections are moved', () => {
      const result = asMinWithWhySectionsMoved({ minText, mdText });

      then('the section is held, and the count names the absent lines', () => {
        expect(result.sectionsHeld).toEqual([
          { header: '## .why', reason: '1 body line(s) absent from the .md' },
        ]);
        expect(result.textNext).toEqual(minText);
      });
    });
  });

  given('[case4] a fenced why header after a movable why section', () => {
    const minText = [
      '## .why',
      'reason',
      '## .shape',
      '```',
      '## .why',
      'fenced prose',
      '```',
    ].join('\n');
    const mdText = ['## .why', 'reason'].join('\n');

    when('[t0] the sections are moved', () => {
      const result = asMinWithWhySectionsMoved({ minText, mdText });

      then('the fenced header opens no second section', () => {
        expect(result.sectionsMoved).toEqual([
          { header: '## .why', lineCount: 2 },
        ]);
        expect(result.sectionsHeld).toEqual([]);
      });

      then('the fenced shape stays whole', () => {
        expect(result.textNext).toEqual(
          ['## .shape', '```', '## .why', 'fenced prose', '```'].join('\n'),
        );
      });
    });
  });

  given('[case5] a fenced why header', () => {
    const minText = ['```', '## .why', 'prose', '```'].join('\n');

    when('[t0] the sections are moved', () => {
      const result = asMinWithWhySectionsMoved({ minText, mdText: minText });

      then('the header inside the fence opens no section', () => {
        expect(result.sectionsMoved).toEqual([]);
        expect(result.sectionsHeld).toEqual([]);
        expect(result.textNext).toEqual(minText);
      });
    });
  });

  given('[case6] a why section left open at the end of the min', () => {
    const minText = ['# rule.x', '## .why', 'the reason'].join('\n');
    const mdText = ['# rule.x', '## .why', 'the reason', 'more'].join('\n');

    when('[t0] the sections are moved', () => {
      const result = asMinWithWhySectionsMoved({ minText, mdText });

      then('the section runs to the end and moves', () => {
        expect(result.sectionsMoved).toEqual([
          { header: '## .why', lineCount: 2 },
        ]);
        expect(result.textNext).toEqual('# rule.x');
      });
    });
  });

  given('[case7] two why sections, one movable and one held', () => {
    const minText = [
      '## .why',
      'free reason',
      '## .the two arguments',
      '> a blockquote is a cue',
      '# end',
    ].join('\n');
    const mdText = ['## .why', 'free reason', '## .the two arguments'].join(
      '\n',
    );

    when('[t0] the sections are moved', () => {
      const result = asMinWithWhySectionsMoved({ minText, mdText });

      then('the peer header opens a section of its own', () => {
        expect(result.sectionsMoved).toEqual([
          { header: '## .why', lineCount: 2 },
        ]);
        expect(result.sectionsHeld).toEqual([
          { header: '## .the two arguments', reason: 'a cue line' },
        ]);
      });

      then('the held section stays where it sat', () => {
        expect(result.textNext).toEqual(
          ['## .the two arguments', '> a blockquote is a cue', '# end'].join(
            '\n',
          ),
        );
      });
    });
  });

  given('[case8] a min with no why section', () => {
    const minText = '# rule.x\n- a cue';

    when('[t0] the sections are moved', () => {
      const result = asMinWithWhySectionsMoved({ minText, mdText: minText });

      then('none moved or held, the text unchanged', () => {
        expect(result).toEqual({
          sectionsMoved: [],
          sectionsHeld: [],
          textNext: minText,
        });
      });
    });
  });

  given('[case9] an empty min', () => {
    when('[t0] the sections are moved', () => {
      const result = asMinWithWhySectionsMoved({ minText: '', mdText: '' });

      then('none moved or held', () => {
        expect(result).toEqual({
          sectionsMoved: [],
          sectionsHeld: [],
          textNext: '',
        });
      });
    });
  });

  given('[case10] a level-3 header inside a why section', () => {
    const minText = ['## .why', 'reason', '### sub head', 'more reason'].join(
      '\n',
    );
    const mdText = minText;

    when('[t0] the sections are moved', () => {
      const result = asMinWithWhySectionsMoved({ minText, mdText });

      then('a level-3 header is a cue, so the section is held', () => {
        // a `###` does not end a section (only levels 1 and 2 do), and it is a header cue
        expect(result.sectionsHeld).toEqual([
          { header: '## .why', reason: 'a cue line' },
        ]);
      });
    });
  });
});
