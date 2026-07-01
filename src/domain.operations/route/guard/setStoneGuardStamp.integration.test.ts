import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { setStoneAsPassed } from '../stones/setStoneAsPassed';
import { isENOENT } from './isENOENT';

const noopContext = {
  cliEmit: { onGuardProgress: () => {}, onGuardHalted: () => {} },
};

/**
 * .what = checks whether a file is present at the given path
 * .why = stamp assertions need a present/absent check without a throw
 * .note = only ENOENT means absent; rethrow other errors (failfast, no failhide)
 */
const isFilePresent = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (isENOENT(error)) return false;
    throw error;
  }
};

/**
 * .what = stabilizes stamp content for deterministic snapshots
 * .why = the guard tree embeds non-deterministic durations, temp paths, and
 *        content hashes; replace each volatile segment with a fixed token so
 *        the stamp's shape is locked and visible in the snapshot without flake
 */
const asStableStamp = (stamp: string, tempDir: string): string =>
  stamp
    .split(tempDir)
    .join('$ROUTE')
    .replace(
      /\b(finished|allowed|blocked|malfunctioned|approved|rejected|exhausted) \d+\.\d+s/g,
      '$1 [TIME]',
    )
    .replace(/\.i\d+\.[a-f0-9]+\.r/g, '.i[N].[HASH].r');

describe('setStoneGuardStamp.integration', () => {
  given('[case1] guard with a peer review and a judge that passes', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(os.tmpdir(), `test-stamp-pass-${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews:',
          '  - echo "blockers: 0\\nnitpicks: 0\\nall good"',
          'judges:',
          '  - echo "passed: true\\nreason: all checks passed"',
        ].join('\n'),
      );
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');
      return { tempDir, stampPath: path.join(tempDir, '1.test.stamp') };
    });

    afterAll(async () => {
      await fs.rm(scene.tempDir, { recursive: true, force: true });
    });

    when('[t0] stone is set as passed', () => {
      const result = useThen('operation succeeds', async () =>
        setStoneAsPassed(
          { stone: '1.test', route: scene.tempDir },
          noopContext,
        ),
      );

      then('the stone passes', () => {
        expect(result.passed).toBe(true);
      });

      then('a stamp file is written next to the stone', async () => {
        expect(await isFilePresent(scene.stampPath)).toBe(true);
      });

      then('the stamp contains the guard tree from stdout', async () => {
        const stamp = await fs.readFile(scene.stampPath, 'utf-8');
        expect(stamp).toContain('route.stone.set');
        expect(stamp).toContain('passage = allowed');
      });

      then('the stamp matches the emitted stdout', async () => {
        const stamp = await fs.readFile(scene.stampPath, 'utf-8');
        expect(stamp).toContain(result.emit!.stdout);
      });

      then('the allowed-passage stamp matches snapshot', async () => {
        const stamp = await fs.readFile(scene.stampPath, 'utf-8');
        expect(asStableStamp(stamp, scene.tempDir)).toMatchSnapshot(
          'stamp-allowed',
        );
      });
    });
  });

  given('[case2] guard with a peer review and a judge that blocks', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(os.tmpdir(), `test-stamp-block-${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews:',
          '  - echo "blockers: 0\\nnitpicks: 0\\nall good"',
          'judges:',
          '  - echo "passed: false\\nreason: blockers found"',
        ].join('\n'),
      );
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');
      return { tempDir, stampPath: path.join(tempDir, '1.test.stamp') };
    });

    afterAll(async () => {
      await fs.rm(scene.tempDir, { recursive: true, force: true });
    });

    when('[t0] stone is set as passed but judge blocks', () => {
      const result = useThen('operation completes', async () =>
        setStoneAsPassed(
          { stone: '1.test', route: scene.tempDir },
          noopContext,
        ),
      );

      then('the stone is blocked', () => {
        expect(result.passed).toBe(false);
      });

      then('a stamp file is written for the blocked outcome', async () => {
        expect(await isFilePresent(scene.stampPath)).toBe(true);
      });

      then('the stamp records the block in stdout', async () => {
        const stamp = await fs.readFile(scene.stampPath, 'utf-8');
        expect(stamp).toContain('passage = blocked');
      });

      then('the stamp appends the stderr detail under a divider', async () => {
        const stamp = await fs.readFile(scene.stampPath, 'utf-8');
        expect(stamp).toContain('─'.repeat(64));
        expect(stamp).toContain(result.emit!.stderr!);
      });

      then('the blocked-passage stamp matches snapshot', async () => {
        const stamp = await fs.readFile(scene.stampPath, 'utf-8');
        expect(asStableStamp(stamp, scene.tempDir)).toMatchSnapshot(
          'stamp-blocked',
        );
      });
    });
  });

  given('[case3] guard with judges only (no peer reviews)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(os.tmpdir(), `test-stamp-nopeer-${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews: []',
          'judges:',
          '  - echo "passed: true\\nreason: all checks passed"',
        ].join('\n'),
      );
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');
      return { tempDir, stampPath: path.join(tempDir, '1.test.stamp') };
    });

    afterAll(async () => {
      await fs.rm(scene.tempDir, { recursive: true, force: true });
    });

    when('[t0] stone is set as passed', () => {
      const result = useThen('operation succeeds', async () =>
        setStoneAsPassed(
          { stone: '1.test', route: scene.tempDir },
          noopContext,
        ),
      );

      then('the stone passes', () => {
        expect(result.passed).toBe(true);
      });

      then('no stamp file is written', async () => {
        expect(await isFilePresent(scene.stampPath)).toBe(false);
      });
    });
  });

  given('[case4] stamp is upserted across repeated runs', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(os.tmpdir(), `test-stamp-upsert-${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews:',
          '  - echo "blockers: 0\\nnitpicks: 0\\nall good"',
          'judges:',
          '  - echo "passed: true\\nreason: all checks passed"',
        ].join('\n'),
      );
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');
      return { tempDir, stampPath: path.join(tempDir, '1.test.stamp') };
    });

    afterAll(async () => {
      await fs.rm(scene.tempDir, { recursive: true, force: true });
    });

    when('[t0] stone is set as passed twice', () => {
      const second = useThen('both runs complete', async () => {
        await setStoneAsPassed(
          { stone: '1.test', route: scene.tempDir },
          noopContext,
        );
        return setStoneAsPassed(
          { stone: '1.test', route: scene.tempDir },
          noopContext,
        );
      });

      then('exactly one stamp file is present', async () => {
        const entries = await fs.readdir(scene.tempDir);
        const stamps = entries.filter((e) => e.endsWith('.stamp'));
        expect(stamps).toEqual(['1.test.stamp']);
      });

      then('the stamp reflects the latest run', async () => {
        const stamp = await fs.readFile(scene.stampPath, 'utf-8');
        expect(stamp).toContain(second.emit!.stdout);
      });
    });
  });

  given(
    '[case5] guard with a peer review and a judge that malfunctions',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = path.join(os.tmpdir(), `test-stamp-malf-${Date.now()}`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');
        // judge exits non-zero/non-2 → malfunction
        await fs.writeFile(
          path.join(tempDir, '1.test.guard'),
          [
            'artifacts:',
            '  - "$route/1.test*.md"',
            'reviews:',
            '  - echo "blockers: 0\\nnitpicks: 0\\nall good"',
            'judges:',
            '  - sh -c "echo broken; exit 1"',
          ].join('\n'),
        );
        await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');
        return { tempDir, stampPath: path.join(tempDir, '1.test.stamp') };
      });

      afterAll(async () => {
        await fs.rm(scene.tempDir, { recursive: true, force: true });
      });

      when('[t0] stone is set as passed but judge malfunctions', () => {
        const result = useThen('operation completes', async () =>
          setStoneAsPassed(
            { stone: '1.test', route: scene.tempDir },
            noopContext,
          ),
        );

        then('the stone is not passed', () => {
          expect(result.passed).toBe(false);
        });

        then(
          'a stamp file is written for the malfunction outcome',
          async () => {
            expect(await isFilePresent(scene.stampPath)).toBe(true);
          },
        );

        then('the stamp records the malfunction passage', async () => {
          const stamp = await fs.readFile(scene.stampPath, 'utf-8');
          expect(stamp).toContain('passage = malfunction');
        });
      });
    },
  );

  given('[case6] guard with a peer review that returns a constraint', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(os.tmpdir(), `test-stamp-cons-${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');
      // review exits 2 with no blockers → genuine constraint
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews:',
          '  - sh -c "echo blockers: 0; exit 2"',
          'judges:',
          '  - echo "passed: true\\nreason: all checks passed"',
        ].join('\n'),
      );
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');
      return { tempDir, stampPath: path.join(tempDir, '1.test.stamp') };
    });

    afterAll(async () => {
      await fs.rm(scene.tempDir, { recursive: true, force: true });
    });

    when('[t0] stone is set as passed but review constrains', () => {
      const result = useThen('operation completes', async () =>
        setStoneAsPassed(
          { stone: '1.test', route: scene.tempDir },
          noopContext,
        ),
      );

      then('the stone is blocked', () => {
        expect(result.passed).toBe(false);
      });

      then('a stamp file is written for the constraint outcome', async () => {
        expect(await isFilePresent(scene.stampPath)).toBe(true);
      });

      then('the stamp records the blocked passage', async () => {
        const stamp = await fs.readFile(scene.stampPath, 'utf-8');
        expect(stamp).toContain('passage = blocked');
      });
    });
  });

  given('[case7] guard with a budget-exhausted peer reviewer', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(os.tmpdir(), `test-stamp-exh-${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');
      // budget:1 reviewer that always finds a blocker; exhausts on attempt 2
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews:',
          '  peer:',
          '    - slug: limited',
          '      run: echo "blockers: 1\\nnitpicks: 0\\nfound issue"',
          '      budget: 1',
          '      level: 1',
          'judges:',
          '  - echo "passed: false\\nreason: blockers found"',
        ].join('\n'),
      );
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');
      return { tempDir, stampPath: path.join(tempDir, '1.test.stamp') };
    });

    afterAll(async () => {
      await fs.rm(scene.tempDir, { recursive: true, force: true });
    });

    when('[t0] budget is consumed then exhausted across runs', () => {
      const result = useThen('exhaustion is reached', async () => {
        // run 1: review runs (budget 1/1), finds blocker
        await setStoneAsPassed(
          { stone: '1.test', route: scene.tempDir },
          noopContext,
        );
        // change artifact to force a fresh hash → run 2 skips (exhausted)
        await fs.writeFile(
          path.join(scene.tempDir, '1.test.md'),
          '# Test artifact\n\nmodified',
        );
        return setStoneAsPassed(
          { stone: '1.test', route: scene.tempDir },
          noopContext,
        );
      });

      then('the stone is blocked by exhaustion', () => {
        expect(result.passed).toBe(false);
        expect(result.emit!.stdout).toContain('exhausted');
      });

      then('a stamp file is written for the exhaustion outcome', async () => {
        expect(await isFilePresent(scene.stampPath)).toBe(true);
      });
    });
  });

  given('[case8] stone with no guard at all', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-stamp-noguard-${Date.now()}`,
      );
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');
      return { tempDir, stampPath: path.join(tempDir, '1.test.stamp') };
    });

    afterAll(async () => {
      await fs.rm(scene.tempDir, { recursive: true, force: true });
    });

    when('[t0] stone is set as passed', () => {
      const result = useThen('operation succeeds', async () =>
        setStoneAsPassed(
          { stone: '1.test', route: scene.tempDir },
          noopContext,
        ),
      );

      then('the stone passes unguarded', () => {
        expect(result.passed).toBe(true);
      });

      then('no stamp file is written', async () => {
        expect(await isFilePresent(scene.stampPath)).toBe(false);
      });
    });
  });
});
