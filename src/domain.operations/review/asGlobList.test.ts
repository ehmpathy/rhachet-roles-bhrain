import { given, then, when } from 'test-fns';

import { asGlobList } from './asGlobList';

describe('asGlobList', () => {
  given('[case1] the flag was never passed', () => {
    when('[t0] it is cast', () => {
      then('it yields an empty list', () => {
        expect(asGlobList({ of: undefined })).toEqual([]);
      });
    });
  });

  given('[case2] the flag arrived as one scalar', () => {
    when('[t0] it is cast', () => {
      then('it yields a one-glob list', () => {
        expect(asGlobList({ of: 'src/**/*.ts' })).toEqual(['src/**/*.ts']);
      });
    });
  });

  given('[case3] the flag arrived as an array', () => {
    when('[t0] it is cast', () => {
      then('it yields that array, unchanged', () => {
        expect(asGlobList({ of: ['src/**/*.ts', '!**/*.test.ts'] })).toEqual([
          'src/**/*.ts',
          '!**/*.test.ts',
        ]);
      });
    });
  });

  /**
   * .why the empty string earns its own case: `[input.of].flat()` looks
   * equivalent but turns `''` into `['']`, which reaches a glob enumerator
   * where an empty glob matches real files, and flips `getAllTargetsJoined`'s
   * `pathsRequested` from false to true — a lane's scope widens with no
   * other assertion in the repo turned red.
   */
  given('[case4] the flag arrived as an empty string', () => {
    when('[t0] it is cast', () => {
      then('it yields an empty list, never a one-glob list of `""`', () => {
        expect(asGlobList({ of: '' })).toEqual([]);
      });
    });
  });
});
