import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { execAsync, genTempDirForRhachet } from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');

describe('driver.route.passage-concurrent.acceptance', () => {
  given('[case1] concurrent writes to passage.jsonl', () => {
    when('[t0] two processes write simultaneously', () => {
      const res = useThen(
        'invoke set on two stones in parallel',
        async () => {
          const tempDir = genTempDirForRhachet({
            slug: 'passage-concurrent',
            clone: ASSETS_DIR,
          });

          await execAsync('npx rhachet roles link --role driver', {
            cwd: tempDir,
          });

          // create artifacts for both stones
          await fs.writeFile(
            path.join(tempDir, '1.vision.md'),
            '# Vision\n\nTest',
          );
          await fs.writeFile(
            path.join(tempDir, '2.criteria.md'),
            '# Criteria\n\nTest',
          );

          // invoke both in parallel (simulates concurrent writes)
          const skillPath = path.join(
            tempDir,
            '.agent/repo=bhrain/role=driver/skills/route.stone.set.sh',
          );

          const [result1, result2] = await Promise.all([
            execAsync(
              `bash "${skillPath}" --stone 1.vision --route . --as passed`,
              { cwd: tempDir },
            ).catch((e) => e),
            execAsync(
              `bash "${skillPath}" --stone 2.criteria --route . --as passed`,
              { cwd: tempDir },
            ).catch((e) => e),
          ]);

          // read passage.jsonl
          const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
          const passageContent = await fs.readFile(passagePath, 'utf-8');
          const lines = passageContent.split('\n').filter(Boolean);

          return { tempDir, result1, result2, passageContent, lines };
        },
      );

      then('both operations complete (one or both succeed)', () => {
        // at least one should succeed
        const code1 = res.result1.code ?? 0;
        const code2 = res.result2.code ?? 0;
        expect(code1 === 0 || code2 === 0).toBe(true);
      });

      then('passage.jsonl contains entries from both operations', () => {
        // POSIX O_APPEND guarantees atomic appends
        expect(res.lines.length).toBeGreaterThanOrEqual(2);
      });

      then('both stone entries are present (no data loss)', () => {
        expect(res.passageContent).toContain('"stone":"1.vision"');
        expect(res.passageContent).toContain('"stone":"2.criteria"');
      });

      then('each entry is valid JSON (no corruption)', () => {
        const parseErrors: string[] = [];
        for (const line of res.lines) {
          try {
            JSON.parse(line);
          } catch {
            parseErrors.push(line);
          }
        }
        expect(parseErrors).toEqual([]);
      });
    });
  });

  given('[case2] rapid sequential writes', () => {
    when('[t0] multiple stones passed in quick succession', () => {
      const res = useThen('invoke set on three stones rapidly', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'passage-rapid',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });

        // create artifacts
        await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
        await fs.writeFile(path.join(tempDir, '2.criteria.md'), '# Criteria');
        await fs.writeFile(path.join(tempDir, '3.plan.md'), '# Plan');

        const skillPath = path.join(
          tempDir,
          '.agent/repo=bhrain/role=driver/skills/route.stone.set.sh',
        );

        // rapid sequential invocations
        await execAsync(
          `bash "${skillPath}" --stone 1.vision --route . --as passed`,
          { cwd: tempDir },
        );
        await execAsync(
          `bash "${skillPath}" --stone 2.criteria --route . --as passed`,
          { cwd: tempDir },
        );
        await execAsync(
          `bash "${skillPath}" --stone 3.plan --route . --as passed`,
          { cwd: tempDir },
        );

        // read passage.jsonl
        const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
        const passageContent = await fs.readFile(passagePath, 'utf-8');
        const lines = passageContent.split('\n').filter(Boolean);

        return { tempDir, passageContent, lines };
      });

      then('passage.jsonl contains all three entries', () => {
        expect(res.lines.length).toEqual(3);
      });

      then('entries are in expected order', () => {
        const entries = res.lines.map((l) => JSON.parse(l) as { stone: string });
        expect(entries[0]!.stone).toEqual('1.vision');
        expect(entries[1]!.stone).toEqual('2.criteria');
        expect(entries[2]!.stone).toEqual('3.plan');
      });

      then('all entries have status passed', () => {
        const entries = res.lines.map(
          (l) => JSON.parse(l) as { status: string },
        );
        expect(entries.every((e) => e.status === 'passed')).toBe(true);
      });
    });
  });

  given('[case3] interleaved pass and approve writes', () => {
    when('[t0] different status types written in parallel', () => {
      const res = useThen(
        'invoke pass and approve in parallel',
        async () => {
          const tempDir = genTempDirForRhachet({
            slug: 'passage-interleaved',
            clone: ASSETS_DIR,
          });

          await execAsync('npx rhachet roles link --role driver', {
            cwd: tempDir,
          });

          // create artifacts
          await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
          await fs.writeFile(path.join(tempDir, '2.criteria.md'), '# Criteria');

          const skillPath = path.join(
            tempDir,
            '.agent/repo=bhrain/role=driver/skills/route.stone.set.sh',
          );

          // invoke pass and approve in parallel
          const [passResult, approveResult] = await Promise.all([
            execAsync(
              `bash "${skillPath}" --stone 1.vision --route . --as passed`,
              { cwd: tempDir },
            ).catch((e) => e),
            execAsync(
              `bash "${skillPath}" --stone 2.criteria --route . --as approved`,
              { cwd: tempDir },
            ).catch((e) => e),
          ]);

          // read passage.jsonl
          const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
          const passageContent = await fs.readFile(passagePath, 'utf-8');
          const lines = passageContent.split('\n').filter(Boolean);

          return { tempDir, passResult, approveResult, passageContent, lines };
        },
      );

      then('both entries are present', () => {
        expect(res.lines.length).toBeGreaterThanOrEqual(2);
      });

      then('passed entry exists for 1.vision', () => {
        const hasPassedEntry = res.lines.some(
          (l) =>
            l.includes('"stone":"1.vision"') && l.includes('"status":"passed"'),
        );
        expect(hasPassedEntry).toBe(true);
      });

      then('approved entry exists for 2.criteria', () => {
        const hasApprovedEntry = res.lines.some(
          (l) =>
            l.includes('"stone":"2.criteria"') &&
            l.includes('"status":"approved"'),
        );
        expect(hasApprovedEntry).toBe(true);
      });

      then('no JSON corruption from interleaved writes', () => {
        const parseErrors: string[] = [];
        for (const line of res.lines) {
          try {
            JSON.parse(line);
          } catch {
            parseErrors.push(line);
          }
        }
        expect(parseErrors).toEqual([]);
      });
    });
  });
});
