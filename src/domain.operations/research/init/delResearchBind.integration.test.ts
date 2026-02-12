import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, when } from 'test-fns';

import { delResearchBind } from './delResearchBind';
import { getResearchBind } from './getResearchBind';
import { setResearchBind } from './setResearchBind';

describe('delResearchBind', () => {
  given('[case1] research is bound on feature branch', () => {
    let tempDir: string;
    const researchDirName = 'v2026_02_09.test-del';

    beforeEach(async () => {
      // create a temp git repo with a bound research directory (ci-safe)
      tempDir = genTempDir({ slug: 'test-research-bind-del-bound', git: true });
      await fs.mkdir(path.join(tempDir, '.research', researchDirName), {
        recursive: true,
      });
      execSync('git checkout -b vlad/test-research-del', { cwd: tempDir });

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

    when('[t0] delResearchBind is called', () => {
      then('removes the flag file and returns deleted: true', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          // verify bound before delete
          const boundBefore = await getResearchBind();
          expect(boundBefore).not.toBeNull();

          // delete
          const result = await delResearchBind();
          expect(result.deleted).toBe(true);

          // verify no longer bound
          const boundAfter = await getResearchBind();
          expect(boundAfter).toBeNull();
        } finally {
          process.chdir(originalCwd);
        }
      });
    });

    when('[t1] delResearchBind is called a second time', () => {
      then('returns deleted: false (idempotent)', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const resultFirst = await delResearchBind();
          expect(resultFirst.deleted).toBe(true);

          const resultSecond = await delResearchBind();
          expect(resultSecond.deleted).toBe(false);
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case2] no research is bound', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create a temp git repo without any bound research (ci-safe)
      tempDir = genTempDir({ slug: 'test-research-bind-del-none', git: true });
      execSync('git checkout -b vlad/test-research-delnone', { cwd: tempDir });
    });

    when('[t0] delResearchBind is called', () => {
      then('returns deleted: false (idempotent)', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const result = await delResearchBind();
          expect(result.deleted).toBe(false);
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case3] cwd option is used', () => {
    let tempDir: string;
    const researchDirName = 'v2026_02_09.test-del-cwd';

    beforeEach(async () => {
      // create a temp git repo with a bound research directory (ci-safe)
      tempDir = genTempDir({ slug: 'test-research-bind-del-cwd', git: true });
      await fs.mkdir(path.join(tempDir, '.research', researchDirName), {
        recursive: true,
      });
      execSync('git checkout -b vlad/test-research-del-cwd', { cwd: tempDir });

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

    when('[t0] delResearchBind is called with cwd option', () => {
      then('works with explicit cwd', async () => {
        const result = await delResearchBind({ cwd: tempDir });
        expect(result.deleted).toBe(true);

        const bound = await getResearchBind({ cwd: tempDir });
        expect(bound).toBeNull();
      });
    });
  });
});
