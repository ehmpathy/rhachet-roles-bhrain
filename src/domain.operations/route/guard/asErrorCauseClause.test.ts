import { given, then, when } from 'test-fns';

import { asErrorCauseClause } from './asErrorCauseClause';

describe('asErrorCauseClause', () => {
  given('[case1] an Error — the overwhelmingly common throw', () => {
    when('[t0] it carries an fs code in its message', () => {
      then('the code survives into the clause', () => {
        // 🔴 the fs code is the whole point: it is what parts an absent file
        //    from a permissions fault for a driver mid-repair
        const error = new Error(
          "ENOENT: no such file or directory, open '/x/brief.md'",
        );
        expect(asErrorCauseClause({ error })).toContain('ENOENT');
      });
    });

    when('[t1] it is a subclass', () => {
      then('it is read the same way', () => {
        class ParseError extends Error {}
        expect(
          asErrorCauseClause({ error: new ParseError('not a duration') }),
        ).toEqual('not a duration');
      });
    });
  });

  given('[case2] a throw that is not an Error', () => {
    when('[t0] a plain object', () => {
      then('it is json, never `[object Object]`', () => {
        // ⚠️ this is the case the naive `String(error)` loses outright — the
        //    clause would name no fault at all, which is worse than absent
        //    because it reads as though a cause was supplied
        const clause = asErrorCauseClause({ error: { code: 'EACCES' } });
        expect(clause).toEqual('{"code":"EACCES"}');
        expect(clause).not.toContain('[object Object]');
      });
    });

    when('[t1] a string', () => {
      then('it passes through', () => {
        expect(asErrorCauseClause({ error: 'boom' })).toEqual('boom');
      });
    });

    when('[t2] a nullish throw', () => {
      then('it names the value rather than crashes', () => {
        expect(asErrorCauseClause({ error: null })).toEqual('null');
        expect(asErrorCauseClause({ error: undefined })).toEqual('undefined');
      });
    });
  });

  given(
    '[case3] a cyclic object — the clause must not become the failure',
    () => {
      when('[t0] json cannot serialize it', () => {
        then('it falls back rather than throws', () => {
          // 🔴 .why = this runs inside a `catch`. a throw from here replaces a
          //    legible refusal with a serialization fault, and the original
          //    cause is lost entirely — the exact failhide this leaf prevents
          const cyclic: Record<string, unknown> = { code: 'EMFILE' };
          cyclic.self = cyclic;

          expect(() => asErrorCauseClause({ error: cyclic })).not.toThrow();
          expect(asErrorCauseClause({ error: cyclic })).toEqual(
            '[object Object]',
          );
        });
      });
    },
  );
});
