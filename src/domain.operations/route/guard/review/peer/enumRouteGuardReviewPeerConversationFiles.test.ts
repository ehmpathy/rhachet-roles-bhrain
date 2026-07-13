import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { enumRouteGuardReviewPeerConversationFiles } from './enumRouteGuardReviewPeerConversationFiles';

/**
 * .what = writes a set of peer-review files into a fresh temp route
 * .why = every case needs the same .reviews/peer/ fixture setup
 *
 * .note = fixtures use the zero-padded i/r grammar (i001, r001) — the real
 *         write grammar (asStoneGuardCounter) — so lexical .sort() equals
 *         numeric order.
 */
const genRouteWithFiles = async (files: string[]): Promise<string> => {
  const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-convo-'));
  const reviewsDir = path.join(route, '.reviews', 'peer');
  await fs.mkdir(reviewsDir, { recursive: true });
  for (const file of files) {
    await fs.writeFile(path.join(reviewsDir, file), '');
  }
  return route;
};

describe('enumRouteGuardReviewPeerConversationFiles', () => {
  given('[case1] prior generations of given + taken exist', () => {
    const scene = useBeforeAll(async () => {
      const route = await genRouteWithFiles([
        '1.vision._.review.i001.abc123.r001._.given.by_peer.arch.md',
        '1.vision._.review.i001.abc123.r001._.taken.by_self.arch.md',
        '1.vision._.review.i002.def456.r001._.given.by_peer.arch.md',
        '1.vision._.review.i002.def456.r001._.taken.by_self.arch.md',
      ]);
      return { route };
    });

    when('[t0] the whole conversation is enumerated (no exclusion)', () => {
      then('unions every given and taken for the stone', async () => {
        const files = await enumRouteGuardReviewPeerConversationFiles({
          route: scene.route,
          stone: '1.vision',
        });
        expect(files).toHaveLength(4);
        expect(files.some((f) => f.includes('_.given.by_peer.'))).toBe(true);
        expect(files.some((f) => f.includes('_.taken.by_self.'))).toBe(true);
      });
    });
  });

  given('[case2] a current generation plus a prior generation', () => {
    const scene = useBeforeAll(async () => {
      const route = await genRouteWithFiles([
        // prior generation (settled)
        '1.vision._.review.i001.abc123.r001._.given.by_peer.arch.md',
        '1.vision._.review.i001.abc123.r001._.taken.by_self.arch.md',
        // current generation (just written this run, unanswered)
        '1.vision._.review.i002.def456.r001._.given.by_peer.arch.md',
        '1.vision._.review.i002.def456.r002._.given.by_peer.mech.md',
      ]);
      return { route };
    });

    when('[t0] the current {iteration,hash} is excluded', () => {
      then(
        'returns only the prior generation, not the current givens',
        async () => {
          const files = await enumRouteGuardReviewPeerConversationFiles({
            route: scene.route,
            stone: '1.vision',
            exclude: { iteration: 2, hash: 'def456' },
          });
          expect(files).toHaveLength(2);
          expect(files.every((f) => f.includes('.i001.abc123.'))).toBe(true);
          expect(files.some((f) => f.includes('.i002.def456.'))).toBe(false);
        },
      );
    });
  });

  given('[case3] a given with an adjacent .report.md', () => {
    const scene = useBeforeAll(async () => {
      const route = await genRouteWithFiles([
        '1.vision._.review.i001.abc123.r001._.given.by_peer.arch.md',
        '1.vision._.review.i001.abc123.r001._.given.by_peer.arch.report.md',
      ]);
      return { route };
    });

    when('[t0] the conversation is enumerated', () => {
      then(
        'the detailed .report.md IS pulled in alongside the summary given',
        async () => {
          const files = await enumRouteGuardReviewPeerConversationFiles({
            route: scene.route,
            stone: '1.vision',
          });
          // both the summary given and its detailed report must be present so a
          // reviewer sees its full prior critique, not just the verdict counts
          expect(files).toHaveLength(2);
          expect(files.some((f) => f.endsWith('.report.md'))).toBe(true);
          expect(
            files.some(
              (f) =>
                f.endsWith('_.given.by_peer.arch.md') &&
                !f.endsWith('.report.md'),
            ),
          ).toBe(true);
        },
      );
    });
  });

  given('[case4] only-given, no takens yet', () => {
    const scene = useBeforeAll(async () => {
      const route = await genRouteWithFiles([
        '1.vision._.review.i001.abc123.r001._.given.by_peer.arch.md',
      ]);
      return { route };
    });

    when('[t0] the conversation is enumerated', () => {
      then('returns the lone given', async () => {
        const files = await enumRouteGuardReviewPeerConversationFiles({
          route: scene.route,
          stone: '1.vision',
        });
        expect(files).toHaveLength(1);
        expect(files[0]).toContain('_.given.by_peer.arch');
      });
    });
  });

  given('[case5] a different stone must be excluded', () => {
    const scene = useBeforeAll(async () => {
      const route = await genRouteWithFiles([
        '1.vision._.review.i001.abc123.r001._.given.by_peer.arch.md',
        '2.plan._.review.i001.ghi789.r001._.given.by_peer.mech.md',
      ]);
      return { route };
    });

    when('[t0] enumerated for stone=1.vision', () => {
      then('returns only 1.vision files', async () => {
        const files = await enumRouteGuardReviewPeerConversationFiles({
          route: scene.route,
          stone: '1.vision',
        });
        expect(files).toHaveLength(1);
        expect(files[0]).toContain('1.vision');
      });
    });
  });

  given('[case6] an empty route (first iteration)', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-convo-'));
      return { route };
    });

    when('[t0] the conversation is enumerated', () => {
      then('returns an empty array (reviewer handles gracefully)', async () => {
        const files = await enumRouteGuardReviewPeerConversationFiles({
          route: scene.route,
          stone: '1.vision',
        });
        expect(files).toEqual([]);
      });
    });
  });

  given('[case7] multi-reviewer, multi-round, with a detailed report', () => {
    const scene = useBeforeAll(async () => {
      // write in a deliberately scrambled order to prove sort re-threads it
      const route = await genRouteWithFiles([
        '1.vision._.review.i002.def456.r001._.taken.by_self.arch.md',
        '1.vision._.review.i001.abc123.r002._.taken.by_self.mech.md',
        '1.vision._.review.i001.abc123.r001._.given.by_peer.arch.report.md',
        '1.vision._.review.i002.def456.r001._.given.by_peer.arch.md',
        '1.vision._.review.i001.abc123.r001._.taken.by_self.arch.md',
        '1.vision._.review.i001.abc123.r002._.given.by_peer.mech.md',
        '1.vision._.review.i001.abc123.r001._.given.by_peer.arch.md',
      ]);
      return { route };
    });

    when('[t0] the conversation is enumerated', () => {
      then(
        'the exact given → report → taken interleave is pinned, round-major',
        async () => {
          const files = await enumRouteGuardReviewPeerConversationFiles({
            route: scene.route,
            stone: '1.vision',
          });
          const names = files.map((file) => path.basename(file));
          // this order is the core contract: within a round the reviewers group
          // by r-index; within a reviewer the given summary precedes its .report
          // detail, which precedes the taken; rounds group by iteration. a change
          // to the filename grammar or a dropped .sort() breaks this.
          expect(names).toEqual([
            // round 1 (i001)
            '1.vision._.review.i001.abc123.r001._.given.by_peer.arch.md',
            '1.vision._.review.i001.abc123.r001._.given.by_peer.arch.report.md',
            '1.vision._.review.i001.abc123.r001._.taken.by_self.arch.md',
            '1.vision._.review.i001.abc123.r002._.given.by_peer.mech.md',
            '1.vision._.review.i001.abc123.r002._.taken.by_self.mech.md',
            // round 2 (i002)
            '1.vision._.review.i002.def456.r001._.given.by_peer.arch.md',
            '1.vision._.review.i002.def456.r001._.taken.by_self.arch.md',
          ]);
        },
      );
    });
  });

  given('[case8] iterations and indices past 9 (numeric, not lexical)', () => {
    const scene = useBeforeAll(async () => {
      // with the zero-padded grammar, i002 < i010 and r002 < r010 lexically —
      // a plain .sort() yields numeric order. this is the whole point of the pad.
      const route = await genRouteWithFiles([
        '1.vision._.review.i010.hjjjjj.r001._.given.by_peer.arch.md',
        '1.vision._.review.i002.h22222.r010._.given.by_peer.arch.md',
        '1.vision._.review.i002.h22222.r002._.given.by_peer.arch.md',
        '1.vision._.review.i002.h22222.r001._.given.by_peer.arch.md',
      ]);
      return { route };
    });

    when('[t0] the conversation is enumerated', () => {
      then(
        'rounds and reviewers order numerically, not lexically',
        async () => {
          const files = await enumRouteGuardReviewPeerConversationFiles({
            route: scene.route,
            stone: '1.vision',
          });
          const names = files.map((file) => path.basename(file));
          expect(names).toEqual([
            // i002 before i010 (numeric round order via zero-pad)
            '1.vision._.review.i002.h22222.r001._.given.by_peer.arch.md',
            '1.vision._.review.i002.h22222.r002._.given.by_peer.arch.md',
            // r002 before r010 (numeric index order via zero-pad)
            '1.vision._.review.i002.h22222.r010._.given.by_peer.arch.md',
            '1.vision._.review.i010.hjjjjj.r001._.given.by_peer.arch.md',
          ]);
        },
      );
    });
  });
});
