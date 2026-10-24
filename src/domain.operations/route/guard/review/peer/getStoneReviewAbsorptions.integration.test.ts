import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { getLiveReviewAbsorptions } from './getLiveReviewAbsorptions';
import { getStoneReviewCorpus } from './getStoneReviewCorpus';

/**
 * .what = the clamp that a filename key revives no stance a rewind voided
 * .why = 🔴 the key is the given's filename (`asReviewGivenKey`), and a rewind of an unchanged
 *        artifact re-mints the identical filename. so the key alone would re-attach a voided
 *        stance; the rewind slice in `getStoneReviewAbsorptions` is what keeps it void. this
 *        pins the two together — key + slice — at the grain the judge reads them, for both row
 *        forms the ledger can hold (a filename, and a foreign absolute path from ≤ 0.42.1)
 *
 * .note = integration grain because the slice reads `passage.jsonl` and the givens are read off
 *         disk; a pure fold could not show that the re-minted given is the same file
 */
const GIVEN_FILENAME =
  '1.test._.review.i001.abc123.r001._.given.by_peer.mech.md';

const genRouteScene = async (input: {
  rows: Record<string, unknown>[];
}): Promise<{ route: string }> => {
  // genTempDir owns the scene's lifecycle — no stray dir left in the ambient tmp
  const route = genTempDir({ slug: 'route-rewind-key' });

  // the lane's one given — the same file before and after the rewind, as a re-mint leaves it
  const reviewsDir = path.join(route, '.reviews', 'peer');
  await fs.mkdir(reviewsDir, { recursive: true });
  await fs.writeFile(
    path.join(reviewsDir, GIVEN_FILENAME),
    '1 blockers\n0 nitpicks\n',
  );

  const routeDir = path.join(route, '.route');
  await fs.mkdir(routeDir, { recursive: true });
  await fs.writeFile(
    path.join(routeDir, 'passage.jsonl'),
    input.rows.map((row) => JSON.stringify(row)).join('\n') + '\n',
  );

  return { route };
};

const asStanceRow = (input: { given: string }): Record<string, unknown> => ({
  stone: '1.test',
  status: 'conceded',
  reviewer: 'mech',
  about: 'blocker.1',
  given: input.given,
  severity: 'better',
});

const REWOUND_ROW = { stone: '1.test', status: 'rewound' };

// a 0.42.1 row, written under a path this process never sees — another clone, another machine
const GIVEN_FOREIGN_ABSOLUTE = `/home/elsewhere/repo/.behavior/v0/.reviews/peer/${GIVEN_FILENAME}`;

/**
 * .what = the stances that still hold, read the way the judge reads them
 * .why = corpus → live is the composition the tally, the urgent read, and the warrant share
 */
const getAllLiveStances = async (input: { route: string }) => {
  const { absorptions, givens } = await getStoneReviewCorpus({
    route: input.route,
    stone: '1.test',
  });
  return { live: getLiveReviewAbsorptions({ absorptions, givens }) };
};

describe('getStoneReviewAbsorptions', () => {
  given('[case1] a filename stance, no rewind', () => {
    const scene = useBeforeAll(async () =>
      genRouteScene({ rows: [asStanceRow({ given: GIVEN_FILENAME })] }),
    );

    when('[t0] the live stances are read', () => {
      const result = useThen('it reads', async () => getAllLiveStances(scene));

      // the contrast that gives [case2] and [case3] their teeth
      then('the stance stands', () => {
        expect(result.live.map((one) => one.about)).toEqual(['blocker.1']);
      });
    });
  });

  given('[case2] a filename stance, then a rewind, same given file', () => {
    const scene = useBeforeAll(async () =>
      genRouteScene({
        rows: [asStanceRow({ given: GIVEN_FILENAME }), REWOUND_ROW],
      }),
    );

    when('[t0] the live stances are read', () => {
      const result = useThen('it reads', async () => getAllLiveStances(scene));

      then('the stance is void — the key does not revive it', () => {
        expect(result.live).toEqual([]);
      });
    });
  });

  given('[case3] a foreign absolute stance (≤ 0.42.1)', () => {
    when('[t0] no rewind follows it', () => {
      const scene = useBeforeAll(async () =>
        genRouteScene({
          rows: [asStanceRow({ given: GIVEN_FOREIGN_ABSOLUTE })],
        }),
      );
      const result = useThen('it reads', async () => getAllLiveStances(scene));

      then('the stance stands — the foreign prefix is not identity', () => {
        expect(result.live.map((one) => one.about)).toEqual(['blocker.1']);
      });
    });

    when('[t1] a rewind follows it', () => {
      const scene = useBeforeAll(async () =>
        genRouteScene({
          rows: [asStanceRow({ given: GIVEN_FOREIGN_ABSOLUTE }), REWOUND_ROW],
        }),
      );
      const result = useThen('it reads', async () => getAllLiveStances(scene));

      then('the stance is void', () => {
        expect(result.live).toEqual([]);
      });
    });
  });

  given('[case4] a stance re-declared after the rewind', () => {
    const scene = useBeforeAll(async () =>
      genRouteScene({
        rows: [
          asStanceRow({ given: GIVEN_FOREIGN_ABSOLUTE }),
          REWOUND_ROW,
          asStanceRow({ given: GIVEN_FILENAME }),
        ],
      }),
    );

    when('[t0] the live stances are read', () => {
      const result = useThen('it reads', async () => getAllLiveStances(scene));

      then('only the fresh stance stands', () => {
        expect(result.live).toHaveLength(1);
        expect(result.live[0]?.given).toEqual(GIVEN_FILENAME);
      });
    });
  });
});
