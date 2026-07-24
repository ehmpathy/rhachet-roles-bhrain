import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { genFile } from './genFile';

describe('genFile.integration', () => {
  given('[case1] the file is absent', () => {
    const tempDir = genTempDir({ slug: 'test-genFile-absent' });

    when('[t0] genFile runs', () => {
      const result = useThen('it reports created', async () => {
        return await genFile({
          at: path.join(tempDir, 'file.md'),
          content: 'hi',
        });
      });

      then('it created the file', () => {
        expect(result.created).toEqual(true);
      });

      then('the file holds the given content', async () => {
        const content = await fs.readFile(
          path.join(tempDir, 'file.md'),
          'utf-8',
        );
        expect(content).toEqual('hi');
      });
    });
  });

  given('[case2] the file already exists', () => {
    const tempDir = genTempDir({ slug: 'test-genFile-present' });

    when('[t0] genFile runs a second time with new content', () => {
      const result = useThen('the second run is a no-op', async () => {
        await genFile({
          at: path.join(tempDir, 'file.md'),
          content: 'hi',
        });
        return await genFile({
          at: path.join(tempDir, 'file.md'),
          content: 'changed',
        });
      });

      then('it reports not-created (idempotent)', () => {
        expect(result.created).toEqual(false);
      });

      then(
        'the original content is left as-is (no drift reconcile)',
        async () => {
          const content = await fs.readFile(
            path.join(tempDir, 'file.md'),
            'utf-8',
          );
          expect(content).toEqual('hi');
        },
      );
    });
  });

  given('[case3] two runs race on the same absent file', () => {
    const tempDir = genTempDir({ slug: 'test-genFile-race' });

    when('[t0] two genFile calls run concurrently', () => {
      // this is the race the primitive exists to absorb: both see absent, both
      // try to create; the loser must catch EEXIST and converge, never throw
      const outcome = useThen('both settle', async () => {
        const at = path.join(tempDir, 'file.md');
        return {
          results: await Promise.allSettled([
            genFile({ at, content: 'a' }),
            genFile({ at, content: 'b' }),
          ]),
        };
      });

      then('neither call rejects (EEXIST is absorbed)', () => {
        const rejected = outcome.results.filter((r) => r.status === 'rejected');
        expect(rejected).toEqual([]);
      });

      then('exactly one call reports created (the winner)', () => {
        const createdCount = outcome.results.filter(
          (r) => r.status === 'fulfilled' && r.value.created,
        ).length;
        expect(createdCount).toEqual(1);
      });
    });
  });

  given('[case4] idem=upsert reconciles drifted content', () => {
    const tempDir = genTempDir({ slug: 'test-genFile-upsert-reconcile' });

    when('[t0] genFile upserts over a file with different content', () => {
      const result = useThen('upsert overwrites it', async () => {
        const at = path.join(tempDir, 'file.md');
        await genFile({ at, content: 'old' });
        return await genFile({ at, content: 'new', idem: 'upsert' });
      });

      then('it reports created (it wrote this run)', () => {
        expect(result.created).toEqual(true);
      });

      then('the content is reconciled to the declared value', async () => {
        const content = await fs.readFile(
          path.join(tempDir, 'file.md'),
          'utf-8',
        );
        expect(content).toEqual('new');
      });
    });
  });

  given('[case5] idem=upsert on already-equal content is a no-op', () => {
    const tempDir = genTempDir({ slug: 'test-genFile-upsert-noop' });

    when('[t0] genFile upserts the same content twice', () => {
      const result = useThen('upsert leaves it as-is', async () => {
        const at = path.join(tempDir, 'file.md');
        await genFile({ at, content: 'same' });
        return await genFile({ at, content: 'same', idem: 'upsert' });
      });

      then('it reports not-created (already at content)', () => {
        expect(result.created).toEqual(false);
      });
    });
  });

  given('[case6] a non-EEXIST fault (parent dir is a file)', () => {
    const tempDir = genTempDir({ slug: 'test-genFile-fault' });

    when('[t0] the file parent is a file, not a dir (ENOTDIR)', () => {
      then('it fails loud (a real fault is never swallowed)', async () => {
        // a plain file, then a file "under" it → ENOTDIR, a real fault that must
        // NOT read as a benign already-present; it fails loud per rule.forbid.failhide
        const filePath = path.join(tempDir, 'not-a-dir');
        await fs.writeFile(filePath, 'i am a file', 'utf-8');

        let threw = false;
        try {
          await genFile({
            at: path.join(filePath, 'file.md'),
            content: 'hi',
          });
        } catch {
          threw = true;
        }
        expect(threw).toEqual(true);
      });
    });
  });
});
