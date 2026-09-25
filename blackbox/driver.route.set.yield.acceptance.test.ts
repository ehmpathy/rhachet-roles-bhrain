import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { isPathFound } from '../src/domain.operations/route/isPathFound';
import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');

describe('driver.route.set.yield.acceptance', () => {
  given('[case1] route.stone.set --as rewound --yield drop', () => {
    when('[t0] stone has yield file', () => {
      const res = useThen('invoke rewound with yield drop', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-yield-drop',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create yield file
        await fs.writeFile(
          path.join(tempDir, '1.vision.yield.md'),
          '# Vision Yield\n\nThis is the yield artifact.',
        );

        // invoke rewind with yield drop
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'rewound', yield: 'drop' },
          cwd: tempDir,
        });

        console.log('\n--- [case1] cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- [case1] cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end [case1] cli ---\n');

        // check yield file is gone from root
        const yieldExists = await isPathFound(
          path.join(tempDir, '1.vision.yield.md'),
        );

        // check yield file is in archive
        const archiveDir = path.join(tempDir, '.route', '.archive');
        const archiveExists = await isPathFound(archiveDir);
        let archivedFiles: string[] = [];
        if (archiveExists) {
          archivedFiles = await fs.readdir(archiveDir);
        }

        return { cli, tempDir, yieldExists, archivedFiles };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stdout shows yield in cleared line', () => {
        expect(res.cli.stdout).toContain('1 yield');
      });

      then('yield file is removed from root', () => {
        expect(res.yieldExists).toBe(false);
      });

      then('yield file is archived', () => {
        expect(res.archivedFiles).toContain('1.vision.yield.md');
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });

    when('[t1] stone has no yield file', () => {
      const res = useThen('invoke rewound with yield drop on empty', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-yield-drop-empty',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // no yield file created

        // invoke rewind with yield drop
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'rewound', yield: 'drop' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stdout shows no yield in cleared line', () => {
        // when no yield file, cleared line does not include "yield"
        expect(res.cli.stdout).not.toContain('1 yield');
      });

      then('stdout matches snapshot', () => {
        // 🔴 .why = `[t0]` was snapped and `[t1]` was not, so a two-step journey pinned only
        //    the half where a yield EXISTS. a `not.toContain` proves one phrase is absent and
        //    says naught about what a driver actually reads on the empty case — which is the
        //    whole subject of this step (`repo-rules` blocker.1 at i018,
        //    `rule.require.snapshot-every-journey-step`)
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] route.stone.set --as rewound --yield keep', () => {
    when('[t0] stone has yield file', () => {
      const res = useThen('invoke rewound with yield keep', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-yield-keep',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create yield file
        await fs.writeFile(
          path.join(tempDir, '1.vision.yield.md'),
          '# Vision Yield\n\nThis is the yield artifact.',
        );

        // invoke rewind with yield keep (explicit)
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'rewound', yield: 'keep' },
          cwd: tempDir,
        });

        console.log('\n--- [case2] cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- [case2] cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end [case2] cli ---\n');

        // check yield file still exists
        const yieldExists = await isPathFound(
          path.join(tempDir, '1.vision.yield.md'),
        );

        return { cli, tempDir, yieldExists };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stdout shows no yield in cleared line (yield preserved)', () => {
        // when yield is preserved, cleared line does not include "yield"
        expect(res.cli.stdout).not.toContain('1 yield');
      });

      then('yield file is preserved', () => {
        expect(res.yieldExists).toBe(true);
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case3] route.stone.set --as rewound (default yield)', () => {
    when('[t0] no yield flag provided', () => {
      const res = useThen('invoke rewound without yield flag', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-yield-default',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create yield file
        await fs.writeFile(
          path.join(tempDir, '1.vision.yield.md'),
          '# Vision Yield\n\nThis is the yield artifact.',
        );

        // invoke rewind without yield flag (should default to keep)
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'rewound' },
          cwd: tempDir,
        });

        // check yield file still exists
        const yieldExists = await isPathFound(
          path.join(tempDir, '1.vision.yield.md'),
        );

        return { cli, tempDir, yieldExists };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('yield file is preserved (default is keep)', () => {
        expect(res.yieldExists).toBe(true);
      });

      then('stdout shows no yield in cleared line (default is keep)', () => {
        // default is keep, so no yield shown in cleared line
        expect(res.cli.stdout).not.toContain('1 yield');
      });

      then('stdout matches snapshot', () => {
        // 🔴 .why this pin = this is the DEFAULT rewind path — the one a driver meets
        //    with no flag at all — and it held only a `not.toContain`. a negative bar
        //    pins the absence of one phrase and no word of the tree around it, so the
        //    round's own `deleted:` → `cleared:` word change would have shipped
        //    unpinned on the most-walked variant
        //    (`rule.require.acceptance-journey-coverage`)
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case4] route.stone.set --as rewound --hard (alias)', () => {
    when('[t0] --hard archives yield', () => {
      const res = useThen('invoke rewound with hard flag', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-hard',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create yield file
        await fs.writeFile(
          path.join(tempDir, '1.vision.yield.md'),
          '# Vision Yield\n\nThis is the yield artifact.',
        );

        // invoke rewind with --hard
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'rewound', hard: true },
          cwd: tempDir,
        });

        // check yield file is gone from root
        const yieldExists = await isPathFound(
          path.join(tempDir, '1.vision.yield.md'),
        );

        // check yield file is in archive
        const archiveDir = path.join(tempDir, '.route', '.archive');
        const archiveExists = await isPathFound(archiveDir);
        let archivedFiles: string[] = [];
        if (archiveExists) {
          archivedFiles = await fs.readdir(archiveDir);
        }

        return { cli, tempDir, yieldExists, archivedFiles };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stdout shows yield in cleared line', () => {
        expect(res.cli.stdout).toContain('1 yield');
      });

      then('yield file is archived', () => {
        expect(res.yieldExists).toBe(false);
        expect(res.archivedFiles).toContain('1.vision.yield.md');
      });

      then('stdout matches snapshot', () => {
        // .why the alias gets its own pin = `--hard` and `--yield drop` are two doors
        //    onto one outcome, and a driver reads whichever they typed. a pin on the
        //    canonical flag alone proves naught about what the alias renders
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case5] route.stone.set --as rewound --soft (alias)', () => {
    when('[t0] --soft preserves yield', () => {
      const res = useThen('invoke rewound with soft flag', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-soft',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create yield file
        await fs.writeFile(
          path.join(tempDir, '1.vision.yield.md'),
          '# Vision Yield\n\nThis is the yield artifact.',
        );

        // invoke rewind with --soft
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'rewound', soft: true },
          cwd: tempDir,
        });

        // check yield file still exists
        const yieldExists = await isPathFound(
          path.join(tempDir, '1.vision.yield.md'),
        );

        return { cli, tempDir, yieldExists };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stdout shows no yield in cleared line', () => {
        expect(res.cli.stdout).not.toContain('1 yield');
      });

      then('yield file is preserved', () => {
        expect(res.yieldExists).toBe(true);
      });

      then('stdout matches snapshot', () => {
        // .why the alias gets its own pin = see the peer note in [case4]; `--soft` and
        //    `--yield keep` are two doors onto one outcome
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case6] cascade yield drop affects multiple stones', () => {
    when('[t0] rewind stone 2 with yield drop cascades to stone 3', () => {
      const res = useThen('invoke rewound with cascade', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-yield-cascade',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create yield files for stones 1, 2, and 3
        await fs.writeFile(path.join(tempDir, '1.vision.yield.md'), '# Vision');
        await fs.writeFile(path.join(tempDir, '2.criteria.yield.md'), '# Criteria');
        await fs.writeFile(path.join(tempDir, '3.plan.yield.md'), '# Plan');

        // invoke rewind on stone 2 with yield drop (should cascade to 2 and 3)
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.criteria', route: '.', as: 'rewound', yield: 'drop' },
          cwd: tempDir,
        });

        console.log('\n--- [case6] cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- [case6] cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end [case6] cli ---\n');

        // check which yield files remain
        const yield1Exists = await isPathFound(
          path.join(tempDir, '1.vision.yield.md'),
        );
        const yield2Exists = await isPathFound(
          path.join(tempDir, '2.criteria.yield.md'),
        );
        const yield3Exists = await isPathFound(
          path.join(tempDir, '3.plan.yield.md'),
        );

        // check archive
        const archiveDir = path.join(tempDir, '.route', '.archive');
        let archivedFiles: string[] = [];
        const archiveExists = await isPathFound(archiveDir);
        if (archiveExists) {
          archivedFiles = await fs.readdir(archiveDir);
        }

        return {
          cli,
          tempDir,
          yield1Exists,
          yield2Exists,
          yield3Exists,
          archivedFiles,
        };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stone 1 yield is preserved (not in cascade)', () => {
        expect(res.yield1Exists).toBe(true);
      });

      then('stone 2 yield is archived (in cascade)', () => {
        expect(res.yield2Exists).toBe(false);
        expect(res.archivedFiles).toContain('2.criteria.yield.md');
      });

      then('stone 3 yield is archived (in cascade)', () => {
        expect(res.yield3Exists).toBe(false);
        expect(res.archivedFiles).toContain('3.plan.yield.md');
      });

      then('stdout shows yield in cleared lines for cascade stones', () => {
        expect(res.cli.stdout).toContain('2.criteria');
        expect(res.cli.stdout).toContain('3.plan');
        // both should show yield in cleared line
        const lines = res.cli.stdout.split('\n');
        const yieldLines = lines.filter((l: string) => l.includes('1 yield'));
        expect(yieldLines.length).toBeGreaterThanOrEqual(2);
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case7] validation errors for flag conflicts', () => {
    when('[t0] --hard and --soft together', () => {
      const res = useThen('invoke with conflict flags', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-yield-conflict-hs',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // invoke with both --hard and --soft
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'rewound', hard: true, soft: true },
          cwd: tempDir,
        });

        return { cli };
      });

      then('cli fails with error', () => {
        expect(res.cli.code).not.toEqual(0);
      });

      then('error mentions mutual exclusivity', () => {
        expect(res.cli.stderr).toContain('mutually exclusive');
      });

      then('stderr matches snapshot', () => {
        // 🔴 .why the four refusals of [case7] each get a pin = each holds a lone
        //    `toContain` of ONE word, and three of the four pin the same word
        //    (`conflicts`). so one message could take another's text and every bar
        //    would stay green while the driver was told about the wrong flag pair
        //    (`rule.require.acceptance-journey-coverage` — the negative path of the
        //    contract is a journey variant too)
        expect(res.cli.stderr).toMatchSnapshot();
      });
    });

    when('[t1] --hard and --yield keep together', () => {
      const res = useThen('invoke with hard and yield keep', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-yield-conflict-hk',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // invoke with --hard and --yield keep
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'rewound', hard: true, yield: 'keep' },
          cwd: tempDir,
        });

        return { cli };
      });

      then('cli fails with error', () => {
        expect(res.cli.code).not.toEqual(0);
      });

      then('error mentions conflict', () => {
        expect(res.cli.stderr).toContain('conflicts');
      });

      then('stderr matches snapshot', () => {
        // .why = see the peer note in [t0]; `conflicts` alone cannot part this
        //    refusal from [t2]'s
        expect(res.cli.stderr).toMatchSnapshot();
      });
    });

    when('[t2] --soft and --yield drop together', () => {
      const res = useThen('invoke with soft and yield drop', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-yield-conflict-sd',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // invoke with --soft and --yield drop
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'rewound', soft: true, yield: 'drop' },
          cwd: tempDir,
        });

        return { cli };
      });

      then('cli fails with error', () => {
        expect(res.cli.code).not.toEqual(0);
      });

      then('error mentions conflict', () => {
        expect(res.cli.stderr).toContain('conflicts');
      });

      then('stderr matches snapshot', () => {
        // .why = see the peer note in [t0]; `conflicts` alone cannot part this
        //    refusal from [t1]'s
        expect(res.cli.stderr).toMatchSnapshot();
      });
    });

    when('[t3] yield flags on non-rewound action', () => {
      const res = useThen('invoke yield flag with passed', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-yield-wrong-action',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // invoke with --yield on passed action
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed', yield: 'drop' },
          cwd: tempDir,
        });

        return { cli };
      });

      then('cli fails with error', () => {
        expect(res.cli.code).not.toEqual(0);
      });

      then('error mentions yield only valid with rewound', () => {
        expect(res.cli.stderr).toContain('rewound');
      });

      then('stderr matches snapshot', () => {
        // .why = `rewound` is a word this message and its three peers all carry, so
        //    the lone bar above cannot tell this refusal from any of them
        expect(res.cli.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case8] yield with multiple yield file extensions', () => {
    when('[t0] stone has .yield, .yield.md, and .yield.json', () => {
      const res = useThen('invoke rewound with multiple yield files', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-yield-multi',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create multiple yield files
        await fs.writeFile(path.join(tempDir, '1.vision.yield'), 'plain yield');
        await fs.writeFile(path.join(tempDir, '1.vision.yield.md'), '# Markdown yield');
        await fs.writeFile(
          path.join(tempDir, '1.vision.yield.json'),
          '{"type": "json yield"}',
        );

        // invoke rewind with yield drop
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'rewound', yield: 'drop' },
          cwd: tempDir,
        });

        // check all yield files are gone
        const yieldPlainExists = await isPathFound(
          path.join(tempDir, '1.vision.yield'),
        );
        const yieldMdExists = await isPathFound(
          path.join(tempDir, '1.vision.yield.md'),
        );
        const yieldJsonExists = await isPathFound(
          path.join(tempDir, '1.vision.yield.json'),
        );

        // check archive
        const archiveDir = path.join(tempDir, '.route', '.archive');
        let archivedFiles: string[] = [];
        const archiveExists = await isPathFound(archiveDir);
        if (archiveExists) {
          archivedFiles = await fs.readdir(archiveDir);
        }

        return {
          cli,
          tempDir,
          yieldPlainExists,
          yieldMdExists,
          yieldJsonExists,
          archivedFiles,
        };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('all yield files are removed from root', () => {
        expect(res.yieldPlainExists).toBe(false);
        expect(res.yieldMdExists).toBe(false);
        expect(res.yieldJsonExists).toBe(false);
      });

      then('all yield files are archived', () => {
        expect(res.archivedFiles).toContain('1.vision.yield');
        expect(res.archivedFiles).toContain('1.vision.yield.md');
        expect(res.archivedFiles).toContain('1.vision.yield.json');
      });

      then('the emit reports ONE yield, though THREE files were archived', () => {
        // 🔴 .why = this is the conjunction the pin below exists for, and a snapshot alone
        //    cannot state it — a re-take would absorb a drift to `3 yields` in silence and
        //    the tree would still look right. the cascade carries a per-stone STATUS, so
        //    the singular is the contract rather than a lost count
        expect(res.cli.stdout).toContain(
          'cleared: 0 reviews, 0 judges, 0 promises, 0 triggers, 1 yield',
        );
        expect(res.cli.stdout).not.toContain('yields');
      });

      then('stdout matches snapshot', () => {
        // 🔴 .why this pin = the bars above read the DISK; none reads what the driver
        //    was told. this variant archives THREE physical yield files — `.yield`,
        //    `.yield.md`, `.yield.json`, each asserted above — and the emit still reports
        //    `1 yield`, because the cascade carries a per-stone STATUS, never a file count
        //    (`formatRouteStoneEmit.ts:499` renders a literal `', 1 yield'` off the
        //    `'archived' | 'preserved' | 'absent'` enum). ⇒ so the pin is what proves the
        //    singular is CORRECT rather than a lost count, and it is the one place a
        //    regression that started to count files — or that pluralized the word — would
        //    show, since every bar above it reads the filesystem instead of the render
        //
        // 🔴 .note = this comment read `a plural count (3 yields)` until i005, which was
        //    false in both halves: the snapshot has always said `1 yield`, and there is no
        //    count in the code to regress. ⇒ a `.why` that misstates its own evidence is
        //    worse than an absent one — a reader checks the tree for `3 yields`, does not
        //    find it, and cannot tell whether the render or the comment is at fault without
        //    a re-derivation of the emit (`enroll-verif-snapshot-coverage` blocker.1)
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });
});
