import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { getResearchBind } from './getResearchBind';
import { setResearchBind } from './setResearchBind';

describe('getResearchBind', () => {
  given('[case1] research is bound on feature branch', () => {
    let tempDir: string;
    const researchDirName = 'v2026_02_09.test-get';

    beforeEach(async () => {
      // create a temp git repo with a bound research directory (ci-safe)
      tempDir = genTempDir({ slug: 'test-research-bind-get-bound', git: true });
      await fs.mkdir(path.join(tempDir, '.research', researchDirName), {
        recursive: true,
      });
      execSync('git checkout -b vlad/test-research-get', { cwd: tempDir });

      // bind the research
      const originalCwd = process.cwd();
      process.chdir(tempDir);
      try {
        await setResearchBind({
          researchDir: path.join('.research', researchDirName),
        });
      } finally {
        process.chdir(originalCwd);
      }
    });

    when('[t0] getResearchBind is called', () => {
      then('returns the bound research directory and name', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const result = await getResearchBind();
          expect(result).not.toBeNull();
          expect(result!.researchDir).toEqual(
            path.join('.research', researchDirName),
          );
          expect(result!.name).toEqual('test-get');
        } finally {
          process.chdir(originalCwd);
        }
      });
    });

    when('[t1] getResearchBind is called with cwd option', () => {
      then('works with explicit cwd', async () => {
        const result = await getResearchBind({ cwd: tempDir });
        expect(result).not.toBeNull();
        expect(result!.name).toEqual('test-get');
      });
    });
  });

  given('[case2] no research is bound', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create a temp git repo without any bound research (ci-safe)
      tempDir = genTempDir({ slug: 'test-research-bind-get-none', git: true });
      execSync('git checkout -b vlad/test-research-none', { cwd: tempDir });
    });

    when('[t0] getResearchBind is called', () => {
      then('returns null', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const result = await getResearchBind();
          expect(result).toBeNull();
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case3] multiple research directories bound', () => {
    let tempDir: string;
    const researchDirA = 'v2026_02_09.research-a';
    const researchDirB = 'v2026_02_09.research-b';

    beforeEach(async () => {
      // create a temp git repo with two research directories (ci-safe)
      tempDir = genTempDir({ slug: 'test-research-bind-get-multi', git: true });
      await fs.mkdir(path.join(tempDir, '.research', researchDirA, '.bind'), {
        recursive: true,
      });
      await fs.mkdir(path.join(tempDir, '.research', researchDirB, '.bind'), {
        recursive: true,
      });
      execSync('git checkout -b vlad/test-research-multi', { cwd: tempDir });

      // manually create two flag files to simulate conflict
      const branchFlat = 'vlad.test-research-multi';
      await fs.writeFile(
        path.join(
          tempDir,
          '.research',
          researchDirA,
          '.bind',
          `${branchFlat}.research-a.flag`,
        ),
        'branch: vlad/test-research-multi\n',
      );
      await fs.writeFile(
        path.join(
          tempDir,
          '.research',
          researchDirB,
          '.bind',
          `${branchFlat}.research-b.flag`,
        ),
        'branch: vlad/test-research-multi\n',
      );
    });

    when('[t0] getResearchBind is called', () => {
      then('throws ambiguity error', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const error = await getError(getResearchBind());
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('multiple research directories');
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });
});
