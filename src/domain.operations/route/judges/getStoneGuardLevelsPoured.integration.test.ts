import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getStoneGuardLevelsPoured } from './getStoneGuardLevelsPoured';

/**
 * .what = coverage for the level-unlock LATCH reader
 * .why = define.invariant.review.peer.level-unlock-is-a-latch. this reader is what the
 *        gate and the passage judge both consult, so its filters carry real weight: a
 *        leak across stones would unlock a level on another stone's run, and a leak
 *        across statuses would latch on an overrule.
 *
 * .note = integration rather than unit — it reads `passage.jsonl` off disk through
 *         `getAllPassageReports`, which is a remote boundary
 *         (rule.forbid.unit.remote-boundaries).
 */
const asStone = (name: string): RouteStone =>
  ({ name }) as unknown as RouteStone;

const genRoute = async (input: {
  slug: string;
  rows: Record<string, unknown>[];
}): Promise<string> => {
  const dir = path.join(
    os.tmpdir(),
    `test-levels-poured-${input.slug}-${Date.now()}`,
  );
  await fs.mkdir(path.join(dir, '.route'), { recursive: true });
  await fs.writeFile(
    path.join(dir, '.route', 'passage.jsonl'),
    input.rows.map((r) => JSON.stringify(r)).join('\n') + '\n',
  );
  return dir;
};

describe('getStoneGuardLevelsPoured', () => {
  given('[case1] no passage ledger at all', () => {
    const dir = path.join(os.tmpdir(), `test-levels-poured-none-${Date.now()}`);
    afterEach(async () => fs.rm(dir, { recursive: true, force: true }));

    when('[t0] read', () => {
      then('the latch is empty — never undefined', async () => {
        // .why = an empty set is the explicit "no level has poured" value the gate
        //        takes; an undefined would make the required input un-passable
        const levels = await getStoneGuardLevelsPoured({
          stone: asStone('5.exec'),
          route: dir,
        });
        expect(levels).toEqual(new Set());
      });
    });
  });

  given('[case2] pours recorded for this stone', () => {
    let dir: string;
    beforeEach(async () => {
      dir = await genRoute({
        slug: 'own',
        rows: [
          { stone: '5.exec', status: 'poured', level: 1 },
          { stone: '5.exec', status: 'poured', level: 3 },
        ],
      });
    });
    afterEach(async () => fs.rm(dir, { recursive: true, force: true }));

    when('[t0] read', () => {
      then('every poured level is returned', async () => {
        const levels = await getStoneGuardLevelsPoured({
          stone: asStone('5.exec'),
          route: dir,
        });
        expect(levels).toEqual(new Set([1, 3]));
      });
    });
  });

  given('[case3] a pour belongs to a DIFFERENT stone', () => {
    let dir: string;
    beforeEach(async () => {
      dir = await genRoute({
        slug: 'otherstone',
        rows: [{ stone: '1.vision', status: 'poured', level: 3 }],
      });
    });
    afterEach(async () => fs.rm(dir, { recursive: true, force: true }));

    when('[t0] read for 5.exec', () => {
      then('it does NOT leak across stones', async () => {
        // 🔴 .why = a leak here would unlock l3 on this stone because a DIFFERENT
        //    stone once ran it — a level opened on a run that never graded this
        //    artifact (rule.forbid.failhide)
        const levels = await getStoneGuardLevelsPoured({
          stone: asStone('5.exec'),
          route: dir,
        });
        expect(levels).toEqual(new Set());
      });
    });
  });

  given('[case4] a level-scoped row of a DIFFERENT status', () => {
    let dir: string;
    beforeEach(async () => {
      dir = await genRoute({
        slug: 'otherstatus',
        rows: [{ stone: '5.exec', status: 'overruled', level: 3 }],
      });
    });
    afterEach(async () => fs.rm(dir, { recursive: true, force: true }));

    when('[t0] read', () => {
      then('an overrule does NOT latch the level', async () => {
        // 🔴 .why = `overruled` and `poured` share a shape and a key, so a status
        //    filter that slipped would make a human's forgiveness read as a run —
        //    two distinct facts collapsed onto one
        const levels = await getStoneGuardLevelsPoured({
          stone: asStone('5.exec'),
          route: dir,
        });
        expect(levels).toEqual(new Set());
      });
    });
  });

  given('[case5] a poured row with no level', () => {
    let dir: string;
    beforeEach(async () => {
      dir = await genRoute({
        slug: 'nolevel',
        rows: [
          { stone: '5.exec', status: 'poured' },
          { stone: '5.exec', status: 'poured', level: 3 },
        ],
      });
    });
    afterEach(async () => fs.rm(dir, { recursive: true, force: true }));

    when('[t0] read', () => {
      then(
        'the level-less row is dropped, never widened to all levels',
        async () => {
          // ⚠️ .why = `overruled` treats an absent level as "all levels" for legacy
          //    rows. a pour must NOT inherit that: a pour is minted by the pour
          //    itself, which knows its level, so a level-less row is unreadable
          //    rather than stone-wide. to widen it would latch EVERY level off one
          //    malformed row
          const levels = await getStoneGuardLevelsPoured({
            stone: asStone('5.exec'),
            route: dir,
          });
          expect(levels).toEqual(new Set([3]));
        },
      );
    });
  });

  given('[case6] a pour cleared by a rewind', () => {
    let dir: string;
    beforeEach(async () => {
      dir = await genRoute({
        slug: 'rewound',
        rows: [
          { stone: '5.exec', status: 'poured', level: 3 },
          { stone: '5.exec', status: 'rewound' },
        ],
      });
    });
    afterEach(async () => fs.rm(dir, { recursive: true, force: true }));

    when('[t0] read after the rewind', () => {
      then('the latch is reset — end to end, off disk', async () => {
        // .why = the reducer's clear is pinned in getAllPassageReports; this pins that
        //        THIS reader inherits it, which is the claim the design rests on
        const levels = await getStoneGuardLevelsPoured({
          stone: asStone('5.exec'),
          route: dir,
        });
        expect(levels).toEqual(new Set());
      });
    });
  });
});
