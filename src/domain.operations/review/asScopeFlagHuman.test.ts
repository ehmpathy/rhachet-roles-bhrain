import { given, then, when } from 'test-fns';

import { asScopeFlagHuman } from './asScopeFlagHuman';

describe('asScopeFlagHuman', () => {
  given('[case1] a flag that was never passed', () => {
    when('[t0] it is rendered', () => {
      then('🔴 it names the absence rather than render blank', () => {
        // the law this exists for: a blank after `paths:` cannot be told from a
        // render that failed, at the exact moment a driver must judge WHICH flag
        // widened their scope (rule.forbid.unexpected-defaults)
        expect(asScopeFlagHuman({ of: undefined })).toEqual('(none)');
      });
    });

    when('[t1] the flag arrived as an empty string', () => {
      then('🔴 it reads as absent too, never as a blank line', () => {
        // an empty `--paths ''` is a flag a shell can hand us, and it matched no
        // file. it must not render as the two spaces a torn template leaves
        expect(asScopeFlagHuman({ of: '' })).toEqual('(none)');
      });
    });

    when('[t2] the flag arrived as an empty array', () => {
      then('🔴 it renders the absence, not an empty join', () => {
        // `[]` is truthy, so a guard on the container alone lets it through to
        // `.join(', ')`, which answers `''` — a blank after `paths:` in the one
        // diagnostic a driver reads to find what widened their scope
        expect(asScopeFlagHuman({ of: [] })).toEqual('(none)');
      });
    });

    when('[t3] every value in the array was empty', () => {
      then('it reads as absent, never as a run of separators', () => {
        // the same law one level in: `['', ''].join(', ')` answers `', '`, which
        // renders as punctuation with no content and no absence marker
        expect(asScopeFlagHuman({ of: ['', ''] })).toEqual('(none)');
      });
    });
  });

  given('[case2] a flag that carries values', () => {
    when('[t0] one scalar was passed', () => {
      then('it renders the value as given', () => {
        expect(asScopeFlagHuman({ of: 'src/**/*.ts' })).toEqual('src/**/*.ts');
      });
    });

    when('[t1] several were passed', () => {
      then('it renders them comma-joined for one scan line', () => {
        expect(
          asScopeFlagHuman({ of: ['src/**/*.ts', 'blackbox/**/*.ts'] }),
        ).toEqual('src/**/*.ts, blackbox/**/*.ts');
      });
    });

    when('[t2] one value arrived inside an array', () => {
      then('🔴 it reads the same as that value passed as a scalar', () => {
        // the whole reason the three call sites collapsed to one name: a driver
        // who passed `--paths x` and one whose parse wrapped it must read the
        // identical line, or the diagnostic implies a difference in scope that
        // does not exist
        expect(asScopeFlagHuman({ of: ['src/**/*.ts'] })).toEqual(
          asScopeFlagHuman({ of: 'src/**/*.ts' }),
        );
      });
    });
  });
});
