import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { genSymlink } from './genSymlink';

describe('genSymlink.integration', () => {
  given('[case1] the link is absent', () => {
    const tempDir = genTempDir({ slug: 'test-genSymlink-absent' });

    when('[t0] genSymlink runs', () => {
      const result = useThen('it reports created', async () => {
        await fs.writeFile(path.join(tempDir, 'target.md'), 'hi', 'utf-8');
        return await genSymlink({
          at: path.join(tempDir, 'link.md'),
          to: 'target.md',
        });
      });

      then('it created the link', () => {
        expect(result.created).toEqual(true);
      });

      then('the link targets the given path', async () => {
        const target = await fs.readlink(path.join(tempDir, 'link.md'));
        expect(target).toEqual('target.md');
      });
    });
  });

  given('[case2] the link already exists', () => {
    const tempDir = genTempDir({ slug: 'test-genSymlink-present' });

    when('[t0] genSymlink runs a second time', () => {
      const result = useThen('the second run is a no-op', async () => {
        await fs.writeFile(path.join(tempDir, 'target.md'), 'hi', 'utf-8');
        await genSymlink({
          at: path.join(tempDir, 'link.md'),
          to: 'target.md',
        });
        return await genSymlink({
          at: path.join(tempDir, 'link.md'),
          to: 'target.md',
        });
      });

      then('it reports not-created (idempotent)', () => {
        expect(result.created).toEqual(false);
      });
    });
  });

  given('[case3] two runs race on the same absent link', () => {
    const tempDir = genTempDir({ slug: 'test-genSymlink-race' });

    when('[t0] two genSymlink calls run concurrently', () => {
      // this is the race the primitive exists to absorb: both see absent, both
      // try to create; the loser must catch EEXIST and converge, never throw
      const outcome = useThen('both settle', async () => {
        await fs.writeFile(path.join(tempDir, 'target.md'), 'hi', 'utf-8');
        const at = path.join(tempDir, 'link.md');
        return {
          results: await Promise.allSettled([
            genSymlink({ at, to: 'target.md' }),
            genSymlink({ at, to: 'target.md' }),
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

  given(
    '[case4] idem=upsert re-points a stale link to the declared target',
    () => {
      const tempDir = genTempDir({ slug: 'test-genSymlink-upsert-repoint' });

      when('[t0] the link already points elsewhere', () => {
        const result = useThen('upsert re-points it', async () => {
          await fs.writeFile(path.join(tempDir, 'old.md'), 'old', 'utf-8');
          await fs.writeFile(path.join(tempDir, 'new.md'), 'new', 'utf-8');
          const at = path.join(tempDir, 'link.md');
          // seed a link at the stale target
          await genSymlink({ at, to: 'old.md' });
          // upsert to the new target
          return await genSymlink({ at, to: 'new.md', idem: 'upsert' });
        });

        then('it reports created (it wrote this run)', () => {
          expect(result.created).toEqual(true);
        });

        then('the link now targets the declared path', async () => {
          const target = await fs.readlink(path.join(tempDir, 'link.md'));
          expect(target).toEqual('new.md');
        });
      });
    },
  );

  given('[case5] idem=upsert on an already-correct link is a no-op', () => {
    const tempDir = genTempDir({ slug: 'test-genSymlink-upsert-noop' });

    when('[t0] the link already points at the declared target', () => {
      const result = useThen('upsert leaves it as-is', async () => {
        await fs.writeFile(path.join(tempDir, 'target.md'), 'hi', 'utf-8');
        const at = path.join(tempDir, 'link.md');
        await genSymlink({ at, to: 'target.md' });
        return await genSymlink({ at, to: 'target.md', idem: 'upsert' });
      });

      then('it reports not-created (already at `to`)', () => {
        expect(result.created).toEqual(false);
      });
    });
  });

  given('[case6] idem=upsert refuses to clobber a non-symlink', () => {
    const tempDir = genTempDir({ slug: 'test-genSymlink-upsert-refuse' });

    when('[t0] a real file already sits at `at`', () => {
      then('upsert fails loud (never deletes a real file)', async () => {
        // a regular file at `at` is an unexpected state — upsert must NOT unlink it
        // to plant a symlink; it fails loud per rule.forbid.failhide
        const at = path.join(tempDir, 'link.md');
        await fs.writeFile(at, 'i am a real file', 'utf-8');
        await fs.writeFile(path.join(tempDir, 'target.md'), 'hi', 'utf-8');

        let threw = false;
        try {
          await genSymlink({ at, to: 'target.md', idem: 'upsert' });
        } catch {
          threw = true;
        }
        expect(threw).toEqual(true);

        // the real file is untouched
        const content = await fs.readFile(at, 'utf-8');
        expect(content).toEqual('i am a real file');
      });
    });
  });

  given('[case7] a non-EEXIST fault (target dir is a file)', () => {
    const tempDir = genTempDir({ slug: 'test-genSymlink-fault' });

    when('[t0] the link parent is a file, not a dir (ENOTDIR)', () => {
      then('it fails loud (a real fault is never swallowed)', async () => {
        // a plain file, then a link "under" it → ENOTDIR, a real fault that must
        // NOT read as a benign lost-race; it fails loud per rule.forbid.failhide
        const filePath = path.join(tempDir, 'not-a-dir');
        await fs.writeFile(filePath, 'i am a file', 'utf-8');

        let threw = false;
        try {
          await genSymlink({
            at: path.join(filePath, 'link.md'),
            to: 'target.md',
          });
        } catch {
          threw = true;
        }
        expect(threw).toEqual(true);
      });
    });
  });
});
