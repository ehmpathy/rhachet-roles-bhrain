import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getAllPassageReports } from './getAllPassageReports';

/**
 * .what = coverage for the passage-ledger reducer — sticky approvals, sticky overrules,
 *         the sticky POUR latch, and the rewind that clears all three with cascade
 *
 * 🔴 .why it is an INTEGRATION test, never a unit one = every case writes a real
 *    `passage.jsonl` into `os.tmpdir()` and reads it back through
 *    `getAllPassageReportsRaw`. the filesystem is a remote boundary, which
 *    `rule.forbid.unit.remote-boundaries` puts out of the unit tier outright.
 *
 *    ⚠️ it sat at `.test.ts` until i018, when `mech-test-scope-purity` raised it — the
 *      misclassification predated this round and the latch cases made it larger. the
 *      honest repair is the tier, never a mock: the reducer's whole contract is what it
 *      reads back off disk, so a mocked fs would clamp the mock rather than the reducer.
 */
describe('getAllPassageReports', () => {
  given('[case1] no passage.jsonl file', () => {
    const tempDir = path.join(os.tmpdir(), `test-passage-empty-${Date.now()}`);

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] file is absent', () => {
      then('returns empty array', async () => {
        const reports = await getAllPassageReports({ route: tempDir });
        expect(reports).toEqual([]);
      });
    });
  });

  given('[case2] empty passage.jsonl file', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-emptyfile-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '.route', 'passage.jsonl'), '');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] file is empty', () => {
      then('returns empty array', async () => {
        const reports = await getAllPassageReports({ route: tempDir });
        expect(reports).toEqual([]);
      });
    });
  });

  given('[case3] passage states use last-entry-wins per stone', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-lastwin-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        [
          JSON.stringify({ stone: '1.vision', status: 'blocked' }),
          JSON.stringify({ stone: '1.vision', status: 'malfunction' }),
          JSON.stringify({ stone: '1.vision', status: 'passed' }),
        ].join('\n') + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] same stone has multiple passage states', () => {
      then('returns only the latest passage state', async () => {
        const reports = await getAllPassageReports({ route: tempDir });
        expect(reports).toHaveLength(1);
        expect(reports[0]).toBeInstanceOf(PassageReport);
        expect(reports[0]!.stone).toEqual('1.vision');
        expect(reports[0]!.status).toEqual('passed');
      });
    });
  });

  given('[case4] approved is sticky (persists with other statuses)', () => {
    const tempDir = path.join(os.tmpdir(), `test-passage-sticky-${Date.now()}`);

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        [
          JSON.stringify({ stone: '1.plan', status: 'approved' }),
          JSON.stringify({ stone: '1.plan', status: 'blocked' }),
        ].join('\n') + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] approved then blocked', () => {
      then('returns both approved AND blocked entries', async () => {
        const reports = await getAllPassageReports({ route: tempDir });
        expect(reports).toHaveLength(2);
        const statuses = reports.map((r) => r.status).sort();
        expect(statuses).toEqual(['approved', 'blocked']);
      });
    });
  });

  given('[case5] approved then passed still has approved', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-approved-passed-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        [
          JSON.stringify({ stone: '1.plan', status: 'approved' }),
          JSON.stringify({ stone: '1.plan', status: 'passed' }),
        ].join('\n') + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] approved then passed', () => {
      then('returns both approved AND passed entries', async () => {
        const reports = await getAllPassageReports({ route: tempDir });
        expect(reports).toHaveLength(2);
        const statuses = reports.map((r) => r.status).sort();
        expect(statuses).toEqual(['approved', 'passed']);
      });
    });
  });

  given('[case6] rewound clears approval', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-rewind-clears-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        [
          JSON.stringify({ stone: '1.plan', status: 'approved' }),
          JSON.stringify({ stone: '1.plan', status: 'passed' }),
          JSON.stringify({ stone: '1.plan', status: 'rewound' }),
        ].join('\n') + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] approved then passed then rewound', () => {
      then('returns only rewound (approval cleared)', async () => {
        const reports = await getAllPassageReports({ route: tempDir });
        expect(reports).toHaveLength(1);
        expect(reports[0]!.status).toEqual('rewound');
      });
    });
  });

  given('[case7] multiple stones with mixed statuses', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-multistones-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        [
          JSON.stringify({ stone: '1.vision', status: 'passed' }),
          JSON.stringify({ stone: '2.plan', status: 'approved' }),
          JSON.stringify({ stone: '2.plan', status: 'blocked' }),
          JSON.stringify({ stone: '3.execute', status: 'malfunction' }),
          JSON.stringify({ stone: '3.execute', status: 'passed' }),
        ].join('\n') + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] multiple stones each with own history', () => {
      then('returns correct current state per stone', async () => {
        const reports = await getAllPassageReports({ route: tempDir });

        // expect 4 reports: 1.vision passed, 2.plan approved, 2.plan blocked, 3.execute passed
        expect(reports).toHaveLength(4);

        const byStone = new Map<string, string[]>();
        for (const r of reports) {
          const statuses = byStone.get(r.stone) ?? [];
          statuses.push(r.status);
          byStone.set(r.stone, statuses);
        }

        expect(byStone.get('1.vision')!.sort()).toEqual(['passed']);
        expect(byStone.get('2.plan')!.sort()).toEqual(['approved', 'blocked']);
        expect(byStone.get('3.execute')!.sort()).toEqual(['passed']);
      });
    });
  });

  given('[case8] malfunction then pass clears malfunction', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-malfunction-clear-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        [
          JSON.stringify({ stone: '1.feature', status: 'malfunction' }),
          JSON.stringify({ stone: '1.feature', status: 'passed' }),
        ].join('\n') + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] malfunction then passed', () => {
      then('returns only passed (malfunction cleared)', async () => {
        const reports = await getAllPassageReports({ route: tempDir });
        expect(reports).toHaveLength(1);
        expect(reports[0]!.status).toEqual('passed');
      });
    });
  });

  given('[case9] blocked then approved then passed', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-blocked-approved-passed-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        [
          JSON.stringify({ stone: '1.plan', status: 'blocked' }),
          JSON.stringify({ stone: '1.plan', status: 'approved' }),
          JSON.stringify({ stone: '1.plan', status: 'passed' }),
        ].join('\n') + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when(
      '[t0] typical approval flow: blocked then approved then passed',
      () => {
        then('returns approved AND passed', async () => {
          const reports = await getAllPassageReports({ route: tempDir });
          expect(reports).toHaveLength(2);
          const statuses = reports.map((r) => r.status).sort();
          expect(statuses).toEqual(['approved', 'passed']);
        });
      },
    );
  });

  given('[case10] re-approve after rewind', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-reapprove-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        [
          JSON.stringify({ stone: '1.plan', status: 'approved' }),
          JSON.stringify({ stone: '1.plan', status: 'passed' }),
          JSON.stringify({ stone: '1.plan', status: 'rewound' }),
          JSON.stringify({ stone: '1.plan', status: 'approved' }),
          JSON.stringify({ stone: '1.plan', status: 'blocked' }),
        ].join('\n') + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] approved, passed, rewound, then re-approved and blocked', () => {
      then(
        'returns new approval AND blocked (approval sticky after re-approve)',
        async () => {
          const reports = await getAllPassageReports({ route: tempDir });
          expect(reports).toHaveLength(2);
          const statuses = reports.map((r) => r.status).sort();
          expect(statuses).toEqual(['approved', 'blocked']);
        },
      );
    });
  });

  given(
    '[case11] cross-stone invalidation: rewind earlier clears later approval',
    () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-passage-crossstone-clears-${Date.now()}`,
      );

      beforeEach(async () => {
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        const content =
          [
            JSON.stringify({ stone: '1.vision', status: 'passed' }),
            JSON.stringify({ stone: '2.plan', status: 'approved' }),
            JSON.stringify({ stone: '2.plan', status: 'passed' }),
            JSON.stringify({ stone: '1.vision', status: 'rewound' }), // rewind to 1 should clear 2's approval
          ].join('\n') + '\n';
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          content,
        );
      });

      afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      when('[t0] stone 1 rewound after stone 2 approved', () => {
        then(
          'stone 2 approval is cleared (cross-stone invalidation)',
          async () => {
            const reports = await getAllPassageReports({ route: tempDir });

            // should have: 1.vision rewound, 2.plan passed (no approval)
            const approvals = reports.filter((r) => r.status === 'approved');
            expect(approvals).toHaveLength(0);

            const stone2Reports = reports.filter((r) => r.stone === '2.plan');
            expect(stone2Reports).toHaveLength(1);
            expect(stone2Reports[0]!.status).toEqual('passed');
          },
        );
      });
    },
  );

  given(
    '[case12] cross-stone invalidation: rewind later does NOT clear earlier approval',
    () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-passage-crossstone-keeps-${Date.now()}`,
      );

      beforeEach(async () => {
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        const content =
          [
            JSON.stringify({ stone: '1.vision', status: 'approved' }),
            JSON.stringify({ stone: '1.vision', status: 'passed' }),
            JSON.stringify({ stone: '2.plan', status: 'approved' }),
            JSON.stringify({ stone: '2.plan', status: 'passed' }),
            JSON.stringify({ stone: '2.plan', status: 'rewound' }), // rewind to 2 should NOT clear 1's approval
          ].join('\n') + '\n';
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          content,
        );
      });

      afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      when('[t0] stone 2 rewound after both stones approved', () => {
        then(
          'stone 1 approval is preserved (not invalidated by later rewind)',
          async () => {
            const reports = await getAllPassageReports({ route: tempDir });

            // stone 1 should still have approval
            const stone1Reports = reports.filter((r) => r.stone === '1.vision');
            const stone1Statuses = stone1Reports.map((r) => r.status).sort();
            expect(stone1Statuses).toEqual(['approved', 'passed']);

            // stone 2 should have no approval (rewound clears same-stone)
            const stone2Reports = reports.filter((r) => r.stone === '2.plan');
            expect(stone2Reports).toHaveLength(1);
            expect(stone2Reports[0]!.status).toEqual('rewound');
          },
        );
      });
    },
  );

  given(
    '[case13] cross-stone invalidation: cascade through multiple stones',
    () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-passage-crossstone-cascade-${Date.now()}`,
      );

      beforeEach(async () => {
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        const content =
          [
            JSON.stringify({ stone: '1.vision', status: 'approved' }),
            JSON.stringify({ stone: '1.vision', status: 'passed' }),
            JSON.stringify({ stone: '2.plan', status: 'approved' }),
            JSON.stringify({ stone: '2.plan', status: 'passed' }),
            JSON.stringify({ stone: '3.execute', status: 'approved' }),
            JSON.stringify({ stone: '3.execute', status: 'blocked' }),
            JSON.stringify({ stone: '1.vision', status: 'rewound' }), // cascade: clears 1, 2, and 3 approvals
          ].join('\n') + '\n';
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          content,
        );
      });

      afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      when('[t0] stone 1 rewound after all three stones approved', () => {
        then('all approvals are cleared (cascade invalidation)', async () => {
          const reports = await getAllPassageReports({ route: tempDir });

          // no approvals should remain
          const approvals = reports.filter((r) => r.status === 'approved');
          expect(approvals).toHaveLength(0);

          // check each stone has correct passage state
          const stone1 = reports.filter((r) => r.stone === '1.vision');
          expect(stone1).toHaveLength(1);
          expect(stone1[0]!.status).toEqual('rewound');

          const stone2 = reports.filter((r) => r.stone === '2.plan');
          expect(stone2).toHaveLength(1);
          expect(stone2[0]!.status).toEqual('passed');

          const stone3 = reports.filter((r) => r.stone === '3.execute');
          expect(stone3).toHaveLength(1);
          expect(stone3[0]!.status).toEqual('blocked');
        });
      });
    },
  );

  // 🔴 the overrule trio is [case20..22] and NOT [case12..14] — it once
  //    collided head-on with the cross-stone trio above ([case11..13]), so two
  //    distinct givens answered to `[case12]` and two to `[case13]`. raised
  //    i020/r1 nitpick.1
  //
  //    ⇒ moved as a GROUP rather than one id at a time, so the three stay
  //    contiguous and a reader still reads them as one subject
  given(
    '[case20] overrule is sticky per level (survives later passage)',
    () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-passage-overrule-sticky-${Date.now()}`,
      );

      beforeEach(async () => {
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        const content =
          [
            JSON.stringify({ stone: '5.exec', status: 'overruled', level: 1 }),
            JSON.stringify({ stone: '5.exec', status: 'blocked' }),
          ].join('\n') + '\n';
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          content,
        );
      });

      afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      when('[t0] level-1 overruled then blocked', () => {
        then(
          'overrule persists alongside the latest passage state',
          async () => {
            const reports = await getAllPassageReports({ route: tempDir });
            const overrules = reports.filter((r) => r.status === 'overruled');
            expect(overrules).toHaveLength(1);
            expect(overrules[0]!.level).toEqual(1);
            const blocked = reports.filter((r) => r.status === 'blocked');
            expect(blocked).toHaveLength(1);
          },
        );
      });
    },
  );

  given('[case21] multiple levels overruled are all retained', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-overrule-multi-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        [
          JSON.stringify({ stone: '5.exec', status: 'overruled', level: 1 }),
          JSON.stringify({ stone: '5.exec', status: 'overruled', level: 3 }),
        ].join('\n') + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] both level 1 and level 3 overruled', () => {
      then('both overrule levels are present', async () => {
        const reports = await getAllPassageReports({ route: tempDir });
        const levels = reports
          .filter((r) => r.status === 'overruled')
          .map((r) => r.level)
          .sort();
        expect(levels).toEqual([1, 3]);
      });
    });
  });

  given('[case22] rewind clears overrule markers', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-overrule-rewind-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        [
          JSON.stringify({ stone: '5.exec', status: 'overruled', level: 1 }),
          JSON.stringify({ stone: '5.exec', status: 'rewound' }),
        ].join('\n') + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] level-1 overruled then rewound', () => {
      then('no overrule remains (cleared by rewind)', async () => {
        const reports = await getAllPassageReports({ route: tempDir });
        const overrules = reports.filter((r) => r.status === 'overruled');
        expect(overrules).toHaveLength(0);
      });
    });
  });

  /**
   * 🔴 .what = the level-unlock LATCH — define.invariant.review.peer.level-unlock-is-a-latch
   * .why = `poured` is sticky per (stone, level) and is cleared by exactly ONE lever: a
   *        rewind. the whole design rests on that reset coming for free from this
   *        reducer rather than from a second implementation — so it is pinned here, or
   *        the "free reset" claim is unproven.
   */
  given('[case15] a poured level is sticky across later passage states', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-poured-sticky-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        [
          JSON.stringify({ stone: '5.exec', status: 'poured', level: 3 }),
          JSON.stringify({ stone: '5.exec', status: 'blocked' }),
        ].join('\n') + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] level-3 poured, then the stone blocked', () => {
      then('the pour persists alongside the latest passage state', async () => {
        // .why = a later blocked/passed/arrived must not evict the latch — the latch
        //        outlives every ordinary passage state by construction
        const reports = await getAllPassageReports({ route: tempDir });
        const pours = reports.filter((r) => r.status === 'poured');
        expect(pours).toHaveLength(1);
        expect(pours[0]!.level).toEqual(3);
        expect(reports.filter((r) => r.status === 'blocked')).toHaveLength(1);
      });
    });
  });

  given('[case16] pours are retained per level, never collapsed', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-poured-multi-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        [
          JSON.stringify({ stone: '5.exec', status: 'poured', level: 1 }),
          JSON.stringify({ stone: '5.exec', status: 'poured', level: 3 }),
        ].join('\n') + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] both l1 and l3 have poured', () => {
      then('both pours are retained', async () => {
        // .why = keyed per (stone, level). a stone-keyed map would keep only the last,
        //        so l1's latch would vanish the moment l3 poured
        const reports = await getAllPassageReports({ route: tempDir });
        const levels = reports
          .filter((r) => r.status === 'poured')
          .map((r) => r.level)
          .sort();
        expect(levels).toEqual([1, 3]);
      });
    });
  });

  given('[case17] a rewind is the ONE lever that resets the latch', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-poured-rewind-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        [
          JSON.stringify({ stone: '5.exec', status: 'poured', level: 3 }),
          JSON.stringify({ stone: '5.exec', status: 'rewound' }),
        ].join('\n') + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] level-3 poured then rewound', () => {
      then('no pour remains — the latch is reset', async () => {
        const reports = await getAllPassageReports({ route: tempDir });
        expect(reports.filter((r) => r.status === 'poured')).toHaveLength(0);
      });
    });
  });

  given('[case18] a rewind cascades the latch reset to LATER stones', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-poured-cascade-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        [
          JSON.stringify({ stone: '1.vision', status: 'poured', level: 3 }),
          JSON.stringify({ stone: '5.exec', status: 'poured', level: 3 }),
          // rewind stone 1 — clears stone 1 AND every later stone
          JSON.stringify({ stone: '1.vision', status: 'rewound' }),
        ].join('\n') + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] an EARLIER stone is rewound', () => {
      then('the later stone loses its latch too', async () => {
        // 🔴 .why = a rewind of stone M invalidates every stone >= M, so a latch on a
        //    downstream stone must not survive it. were it to, that stone would pour a
        //    level on the strength of a run against an artifact the rewind discarded
        const reports = await getAllPassageReports({ route: tempDir });
        expect(reports.filter((r) => r.status === 'poured')).toHaveLength(0);
      });
    });
  });

  given(
    '[case19] a rewind does NOT reset the latch of an EARLIER stone',
    () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-passage-poured-nocascade-${Date.now()}`,
      );

      beforeEach(async () => {
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        const content =
          [
            JSON.stringify({ stone: '1.vision', status: 'poured', level: 3 }),
            JSON.stringify({ stone: '5.exec', status: 'poured', level: 3 }),
            // rewind the LATER stone — the earlier one keeps its latch
            JSON.stringify({ stone: '5.exec', status: 'rewound' }),
          ].join('\n') + '\n';
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          content,
        );
      });

      afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      when('[t0] a LATER stone is rewound', () => {
        then('the earlier stone keeps its latch', async () => {
          // ⚠️ .why = the reset must be as narrow as the cascade rule says. a rewind that
          //    cleared every stone would silently re-gate levels on stones the human
          //    never touched — the opposite failure to case18, and just as wrong
          const reports = await getAllPassageReports({ route: tempDir });
          const pours = reports.filter((r) => r.status === 'poured');
          expect(pours).toHaveLength(1);
          expect(pours[0]!.stone).toEqual('1.vision');
        });
      });
    },
  );
});
