import * as path from 'path';
import { given, then, when } from 'test-fns';

import { asReviewRunIdentity } from '@src/domain.operations/review/asReviewRunIdentity';

import { asReviewLanePokeOutputPath } from './asReviewLanePokeOutputPath';

const DIR_OF_PEER = path.join(
  '.behavior',
  'v2026_11_01.demo',
  '.reviews',
  'peer',
);

describe('asReviewLanePokeOutputPath', () => {
  given('[case1] a primer output in the guard grammar', () => {
    const output = path.join(
      DIR_OF_PEER,
      '5.1.execution._.review.i3.abc123.r2._.given.by_peer.repo-rules.report.md',
    );

    when('[t0] the poke path is derived', () => {
      const poke = asReviewLanePokeOutputPath({ output });

      then('it keeps the primer dir, stone, round, hash, and index', () => {
        expect(asReviewRunIdentity({ output: poke })).toEqual({
          ...asReviewRunIdentity({ output }),
          slug: 'poke.repo-rules',
        });
      });

      then('it names a path apart from the primer report', () => {
        expect(poke).not.toEqual(output);
        expect(path.dirname(poke)).toEqual(DIR_OF_PEER);
      });
    });
  });

  given('[case2] a primer output outside the guard grammar', () => {
    when('[t0] the poke path is derived', () => {
      then('it names the primer path as is', () => {
        expect(asReviewLanePokeOutputPath({ output: 'review.md' })).toEqual(
          'review.md',
        );
      });
    });
  });
});
