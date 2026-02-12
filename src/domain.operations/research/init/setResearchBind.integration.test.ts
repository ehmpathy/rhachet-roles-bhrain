import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { setResearchBind } from './setResearchBind';

describe('setResearchBind', () => {
  given('[case1] valid research dir on a feature branch', () => {
    let tempDir: string;
    const researchDirName = 'v2026_02_09.test-research';

    beforeEach(async () => {
      // create a temp git repo with a research directory (ci-safe)
      tempDir = genTempDir({ slug: 'test-research-bind-set-valid', git: true });
      await fs.mkdir(path.join(tempDir, '.research', researchDirName), {
        recursive: true,
      });
      execSync('git checkout -b vlad/test-research-bind', { cwd: tempDir });
    });

    when('[t0] research dir found and branch is not protected', () => {
      then('creates flag file with correct format', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const researchDir = path.join('.research', researchDirName);
          const result = await setResearchBind({ researchDir });
          expect(result.researchDir).toEqual(researchDir);

          // verify flag file found
          const flagContent = await fs.readFile(result.flagPath, 'utf-8');
          expect(flagContent).toContain('branch: vlad/test-research-bind');
          expect(flagContent).toContain('research: test-research');
          expect(flagContent).toContain('bound_by: init.research skill');

          // verify flag location
          expect(result.flagPath).toContain(
            path.join('.research', researchDirName, '.bind'),
          );
          expect(result.flagPath).toContain(
            'vlad.test-research-bind.test-research.flag',
          );
        } finally {
          process.chdir(originalCwd);
        }
      });
    });

    when('[t1] same research dir bound a second time', () => {
      then('returns idempotent result without error', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const researchDir = path.join('.research', researchDirName);
          const resultFirst = await setResearchBind({ researchDir });
          const resultSecond = await setResearchBind({ researchDir });
          expect(resultSecond.researchDir).toEqual(resultFirst.researchDir);
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case2] research directory does not exist', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create a temp git repo without the research directory (ci-safe)
      tempDir = genTempDir({ slug: 'test-research-bind-set-nodir', git: true });
      execSync('git checkout -b vlad/test-research-nodir', { cwd: tempDir });
    });

    when('[t0] research path is absent', () => {
      then('throws error with path in message', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const error = await getError(
            setResearchBind({ researchDir: '.research/nonexistent' }),
          );
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('research directory does not exist');
          expect(error.message).toContain('nonexistent');
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case3] protected branch (main)', () => {
    let tempDir: string;
    const researchDirName = 'v2026_02_09.test-protected';

    beforeEach(async () => {
      // create a temp git repo on main branch (ci-safe)
      tempDir = genTempDir({
        slug: 'test-research-bind-set-protected',
        git: true,
      });
      await fs.mkdir(path.join(tempDir, '.research', researchDirName), {
        recursive: true,
      });
      // genTempDir initializes on main branch by default, no checkout needed
    });

    when('[t0] branch is main', () => {
      then('throws protected branch error', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const researchDir = path.join('.research', researchDirName);
          const error = await getError(setResearchBind({ researchDir }));
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain(
            'cannot bind research on protected branch',
          );
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case4] different research already bound', () => {
    let tempDir: string;
    const researchDirA = 'v2026_02_09.research-a';
    const researchDirB = 'v2026_02_09.research-b';

    beforeEach(async () => {
      // create a temp git repo with two research directories (ci-safe)
      tempDir = genTempDir({
        slug: 'test-research-bind-set-conflict',
        git: true,
      });
      await fs.mkdir(path.join(tempDir, '.research', researchDirA), {
        recursive: true,
      });
      await fs.mkdir(path.join(tempDir, '.research', researchDirB), {
        recursive: true,
      });
      execSync('git checkout -b vlad/test-research-conflict', { cwd: tempDir });
    });

    when('[t0] bind to research-a then attempt research-b', () => {
      then('throws already-bound error', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          await setResearchBind({
            researchDir: path.join('.research', researchDirA),
          });
          const error = await getError(
            setResearchBind({
              researchDir: path.join('.research', researchDirB),
            }),
          );
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('already bound to');
          expect(error.message).toContain('research-a');
          expect(error.message).toContain('research.bind --del');
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });
});
