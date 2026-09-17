import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
import { getStoneDisputedConcernCounts } from '@src/domain.operations/route/guard/review/peer/getStoneDisputedConcernCounts';

import { answerEveryPeerGiven } from '../__test_assets__/answerEveryPeerGiven';
import { genContextReviewBrainSupplyDemo } from '../__test_assets__/genContextReviewBrainSupplyDemo';
import { setStoneAsConcernAbsorbed } from './setStoneAsConcernAbsorbed';
import { setStoneAsPassed } from './setStoneAsPassed';
import { setStoneAsRewound } from './setStoneAsRewound';

const noopContext = genContextReviewBrainSupplyDemo();
const emitContext: ContextCliEmit = {
  cliEmit: { onGuardProgress: () => {} },
};

/**
 * .what = clamps the vision's pit-of-success row — *"a dispute the driver regrets →
 *         `--as rewound` clears it, because `delStoneGuardArtifacts` deletes the givens
 *         the stance keys to"*
 *
 * .why = r10 b6 read this row as the one vision-table row with NO clamp at all.
 *        `assertAbsorptionIsNotContrary.test.ts` only checks the refusal MENTIONS
 *        `--as rewound`; it never exercised a rewind that actually clears a stance.
 *        so the one documented undo for a regretted dispute was a promise, never a check.
 *
 * 🔴 the mechanism under test is INDIRECT, which is exactly why it needs a test: the
 *    rewind never touches `passage.jsonl`'s absorption rows. it deletes the GIVENS, and
 *    `getLiveReviewAbsorptions` keys each stance to its slug's latest given — so the
 *    stance lapses by construction. a refactor that keyed a stance to (stone, slug)
 *    would leave the lane dark forever past its own rewind, and no extant test would go red.
 */
describe('setStoneAsRewound.absorption.integration', () => {
  given('[case1] a live dispute the driver regrets', () => {
    let tempDir: string;
    let fulcrumRel: string;

    const readPassageRows = async (): Promise<Record<string, unknown>[]> => {
      const content = await fs.readFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        'utf-8',
      );
      return content
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line) as Record<string, unknown>);
    };

    beforeAll(async () => {
      tempDir = path.join(
        process.cwd(),
        '.tmp',
        `test-rewind-absorption-${Date.now()}`,
      );
      await fs.mkdir(tempDir, { recursive: true });
      // its own git root, so path relativization behaves as a real checkout does
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });

      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews:',
          '  peer:',
          '    - slug: limited',
          '      run: echo "blockers: 1\\nnitpicks: 0\\ntest review"',
          '      budget: 5',
          '      level: 1',
          'judges:',
          '  - echo "passed: false\\nreason: blockers found"',
        ].join('\n'),
      );
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');

      const fulcrumsDir = path.join(tempDir, '.fulcrums');
      await fs.mkdir(fulcrumsDir, { recursive: true });
      fulcrumRel = '.fulcrums/inventory.of=fulcrums.case=F001-test.md';
      await fs.writeFile(
        path.join(tempDir, fulcrumRel),
        '# F001 — the argument the council reads',
      );
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when(
      '[t0] the lane rejects, is answered, and its blocker is disputed',
      () => {
        const outcome = useThen('the dispute is recorded', async () => {
          await setStoneAsPassed(
            { stone: '1.test', route: tempDir },
            noopContext,
          );
          await answerEveryPeerGiven({ route: tempDir, stone: '1.test' });
          return setStoneAsConcernAbsorbed({
            stone: '1.test',
            route: tempDir,
            as: 'disputed',
            with: 'limited',
            about: 'blocker.1',
            why: fulcrumRel,
          });
        });

        then('the write path reports the dispute', () => {
          expect(outcome.disputed).toBe(true);
        });

        then(
          'the dispute is LIVE — it sheds one blocker from the tally',
          async () => {
            const counts = await getStoneDisputedConcernCounts({
              route: tempDir,
              stone: '1.test',
            });
            expect(counts).toEqual({ blockers: 1, nitpicks: 0 });
          },
        );
      },
    );

    when('[t1] the driver regrets it and rewinds the stone', () => {
      const rewound = useThen('the rewind runs', async () =>
        setStoneAsRewound({ stone: '1.test', route: tempDir }, emitContext),
      );

      then('the rewind reports success', () => {
        expect(rewound.rewound).toBe(true);
      });

      then(
        'the dispute no longer stands — it sheds naught from the tally',
        async () => {
          // the row is still in the ledger; what changed is that the given it keyed
          // to is gone, so `getLiveReviewAbsorptions` no longer counts it
          const counts = await getStoneDisputedConcernCounts({
            route: tempDir,
            stone: '1.test',
          });
          expect(counts).toEqual({ blockers: 0, nitpicks: 0 });
        },
      );

      then(
        'the ledger is append-only — the disputed row SURVIVES',
        async () => {
          // a rewind voids a stance; it does not erase the record that one was taken.
          // the council still reads what the driver argued, and when
          const rows = await readPassageRows();
          const disputes = rows.filter((row) => row.status === 'disputed');
          expect(disputes).toHaveLength(1);
          expect(disputes[0]!.reviewer).toEqual('limited');
          expect(disputes[0]!.about).toEqual('blocker.1');
        },
      );

      then('a `rewound` row was appended after it', async () => {
        const rows = await readPassageRows();
        expect(rows[rows.length - 1]!.status).toEqual('rewound');
      });

      then(
        'the fulcrum entry is untouched — the argument outlives the stance',
        async () => {
          await expect(
            fs.readFile(path.join(tempDir, fulcrumRel), 'utf-8'),
          ).resolves.toContain('F001');
        },
      );
    });

    when('[t2] the driver re-arrives after the rewind', () => {
      const reran = useThen('the lane runs again', async () =>
        setStoneAsPassed({ stone: '1.test', route: tempDir }, noopContext),
      );

      then('the stone is held again — the lane re-raised its blocker', () => {
        // the whole point of the rewind: the lens returns. a stance keyed to
        // (stone, slug) would leave this lane dark and the stone would pass
        expect(reran.passed).toBe(false);
      });

      then(
        'and the dispute is still void — a fresh given owes a fresh stance',
        async () => {
          const counts = await getStoneDisputedConcernCounts({
            route: tempDir,
            stone: '1.test',
          });
          expect(counts).toEqual({ blockers: 0, nitpicks: 0 });
        },
      );
    });
  });
});
