import { ConstraintError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { asTreeLines } from './asTreeLines';
import { emitEducationRefusal } from './emitEducationRefusal';

/**
 * .what = the stderr lines an emit wrote, captured via a spy that writes naught
 */
const getStderrLinesOf = (input: { emit: () => void }): string[] => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  input.emit();
  const lines = spy.mock.calls.map((call) => String(call[0]));
  spy.mockRestore();
  return lines;
};

describe('emitEducationRefusal', () => {
  given('[case1] a refusal with facts and a hint', () => {
    when('[t0] it is emitted', () => {
      const lines = getStderrLinesOf({
        emit: () =>
          emitEducationRefusal({
            error: new ConstraintError('no role mechanik in this repo', {
              role: 'mechanik',
              rolesFound: ['mechanic (own)', 'architect (linked, bhuild)'],
              hint: 'did you mean --for mechanic?',
            }),
          }),
      });

      then('it opens with the qualified header', () => {
        expect(lines[0]).toEqual(
          '✋ ConstraintError: no role mechanik in this repo',
        );
      });

      then(
        'each fact is a branch, a list its own children, the hint left out',
        () => {
          expect(lines.slice(1, -1)).toEqual([
            '   ├─ role = mechanik',
            '   ├─ roles found',
            '   │  ├─ mechanic (own)',
            '   │  └─ architect (linked, bhuild)',
          ]);
        },
      );

      then('it closes with the fix', () => {
        expect(lines.at(-1)).toEqual('   └─ fix: did you mean --for mechanic?');
      });

      then('it renders as the snapshot shows', () => {
        expect(lines.join('\n')).toContain('✋ ConstraintError:');
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case2] a refusal with no hint', () => {
    when('[t0] it is emitted', () => {
      then('the fix names the general way out', () => {
        const lines = getStderrLinesOf({
          emit: () =>
            emitEducationRefusal({
              error: new ConstraintError(
                'a course runs only within a pursuit',
                {
                  bound: null,
                },
              ),
            }),
        });
        expect(lines).toEqual([
          '✋ ConstraintError: a course runs only within a pursuit',
          '   ├─ bound = (none)',
          '   └─ fix: clear the cause above, then rerun',
        ]);
      });
    });
  });
});

describe('asTreeLines', () => {
  given('[case1] a list of three', () => {
    when('[t0] it is rendered', () => {
      then('every item is a branch, the last one closed', () => {
        expect(
          asTreeLines({ indent: '   │  ', items: ['a', 'b', 'c'] }),
        ).toEqual(['   │  ├─ a', '   │  ├─ b', '   │  └─ c']);
      });
    });
  });

  given('[case2] an empty list', () => {
    when('[t0] it is rendered', () => {
      then('it renders no line', () => {
        expect(asTreeLines({ indent: '   ', items: [] })).toEqual([]);
      });
    });
  });
});
