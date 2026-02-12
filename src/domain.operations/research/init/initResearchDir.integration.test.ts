import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { initResearchDir } from './initResearchDir';

describe('initResearchDir', () => {
  given('[case1] valid name on a feature branch', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create a temp git repo (ci-safe)
      tempDir = genTempDir({ slug: 'test-init-research-valid', git: true });
      execSync('git checkout -b vlad/test-init-research', { cwd: tempDir });
    });

    when('[t0] initResearchDir is called', () => {
      then('creates research directory with templates', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const result = await initResearchDir({
            name: 'consensus-algorithms',
          });

          // verify research directory created
          expect(result.researchDir).toMatch(
            /^\.research\/v\d{4}_\d{2}_\d{2}\.consensus-algorithms$/,
          );

          // verify templates created
          expect(result.created).toContain('0.wish.md');
          expect(result.created).toContain('1.1.probes.aim.internal.stone');
          expect(result.created).toContain('2.probes.emit.stone');
          expect(result.created).toContain('3.1.probes.absorb.kernels.stone');
          expect(result.created).toContain('5.1.briefs.curate.blueprint.stone');

          // verify bind flag created
          expect(result.flagPath).toContain('.bind/');
          expect(result.flagPath).toContain('consensus-algorithms.flag');

          // verify 0.wish.md found
          const wishPath = path.join(tempDir, result.researchDir, '0.wish.md');
          const wishContent = await fs.readFile(wishPath, 'utf-8');
          expect(wishContent).toContain('wish =');

          // verify variable substitution in template
          const aimPath = path.join(
            tempDir,
            result.researchDir,
            '1.1.probes.aim.internal.stone',
          );
          const aimContent = await fs.readFile(aimPath, 'utf-8');
          expect(aimContent).toContain(result.researchDir);
          expect(aimContent).not.toContain('$RESEARCH_DIR_REL');
        } finally {
          process.chdir(originalCwd);
        }
      });
    });

    when('[t1] initResearchDir is called a second time', () => {
      then('returns idempotent result', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const resultFirst = await initResearchDir({
            name: 'consensus-algorithms',
          });
          const resultSecond = await initResearchDir({
            name: 'consensus-algorithms',
          });

          expect(resultSecond.researchDir).toEqual(resultFirst.researchDir);
          expect(resultSecond.created).toEqual([]);
          expect(resultSecond.kept).toEqual([]);
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case2] invalid name format', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create a temp git repo (ci-safe)
      tempDir = genTempDir({ slug: 'test-init-research-invalid', git: true });
      execSync('git checkout -b vlad/test-init-invalid', { cwd: tempDir });
    });

    when('[t0] name contains uppercase', () => {
      then('throws validation error', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const error = await getError(
            initResearchDir({ name: 'Consensus-Algorithms' }),
          );
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('lowercase alphanumeric');
        } finally {
          process.chdir(originalCwd);
        }
      });
    });

    when('[t1] name contains spaces', () => {
      then('throws validation error', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const error = await getError(
            initResearchDir({ name: 'consensus algorithms' }),
          );
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('lowercase alphanumeric');
        } finally {
          process.chdir(originalCwd);
        }
      });
    });

    when('[t2] name contains underscores', () => {
      then('throws validation error', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const error = await getError(
            initResearchDir({ name: 'consensus_algorithms' }),
          );
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('lowercase alphanumeric');
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case3] protected branch', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create a temp git repo on main branch (ci-safe)
      tempDir = genTempDir({ slug: 'test-init-research-protected', git: true });
      // genTempDir initializes on main branch by default
    });

    when('[t0] branch is main', () => {
      then('throws protected branch error', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const error = await getError(
            initResearchDir({ name: 'consensus-algorithms' }),
          );
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('protected branch');
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case4] dir option is used', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create a temp git repo (ci-safe)
      tempDir = genTempDir({ slug: 'test-init-research-dir', git: true });
      execSync('git checkout -b vlad/test-init-dir', { cwd: tempDir });
    });

    when('[t0] dir option points to temp directory', () => {
      then('creates research directory in specified dir', async () => {
        const result = await initResearchDir({
          name: 'consensus-algorithms',
          dir: tempDir,
        });

        expect(result.researchDir).toMatch(
          /^\.research\/v\d{4}_\d{2}_\d{2}\.consensus-algorithms$/,
        );

        // verify directory found on disk
        const fullPath = path.join(tempDir, result.researchDir);
        const stat = await fs.stat(fullPath);
        expect(stat.isDirectory()).toBe(true);
      });
    });
  });
});
