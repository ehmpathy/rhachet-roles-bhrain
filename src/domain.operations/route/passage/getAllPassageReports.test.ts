import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getAllPassageReports } from './getAllPassageReports';

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
});
