import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { genDomainTermsScaffold } from './genDomainTermsScaffold';
import { getDomainTermsPaths } from './getDomainTermsPaths';

describe('genDomainTermsScaffold.integration', () => {
  const paths = getDomainTermsPaths();

  given('[case1] a repo with no glossary dir yet', () => {
    const tempDir = genTempDir({ slug: 'test-genDomainTermsScaffold-fresh' });

    when('[t0] the scaffold is findserted', () => {
      const result = useThen('findsert succeeds', async () => {
        const cwdBefore = process.cwd();
        process.chdir(tempDir);
        try {
          return await genDomainTermsScaffold();
        } finally {
          process.chdir(cwdBefore);
        }
      });

      then('the glossary dir is created', async () => {
        const stat = await fs.stat(path.join(tempDir, paths.glossaryDir));
        expect(stat.isDirectory()).toEqual(true);
      });

      then('the cache dir (staleness sentinel home) is created', async () => {
        const stat = await fs.stat(path.join(tempDir, paths.cacheDir));
        expect(stat.isDirectory()).toEqual(true);
      });

      then(
        'the cache holds a self-exclusive .gitignore (sentinel never leaks to git)',
        async () => {
          // the sweep writes a walltime progress.md here; the .gitignore keeps
          // that ephemeral sentinel out of the tree (no timestamp committed)
          const content = await fs.readFile(
            path.join(tempDir, paths.cacheGitignorePath),
            'utf-8',
          );
          expect(content).toContain('*');
          expect(content).toContain('!.gitignore');
        },
      );

      then(
        'the readme is a symlink back to the briefs (like the rules)',
        async () => {
          // the readme is the learner role's brief too; the glossary links back to it
          // via the same install-managed target as the rules. in a bare tempDir that
          // target is absent, so assert the LINK (readlink), not its content — the
          // resolved content is proven end-to-end by the boot-reachability test
          const target = await fs.readlink(
            path.join(tempDir, paths.readmeSymlink.at),
          );
          expect(target).toEqual(paths.readmeSymlink.to);
        },
      );

      then(
        'the scaffold writes no glossary .gitignore (no consumer needs one)',
        async () => {
          // the boot-test sentinel's leak-guard is NOT a scaffold concern — only this
          // repo's boot-reachability test writes a __boottest__ term, so a scaffold
          // every consumer runs must not litter their glossary with a rule for it. the
          // guard is owned by that test (domainTermsBootReachability), not here
          const absent = await fs
            .access(path.join(tempDir, paths.glossaryGitignorePath))
            .then(() => false)
            .catch(() => true);
          expect(absent).toEqual(true);
        },
      );

      then(
        'both rule symlinks are created, each a link back to the briefs',
        async () => {
          for (const link of paths.ruleSymlinks) {
            const target = await fs.readlink(path.join(tempDir, link.at));
            expect(target).toEqual(link.to);
          }
        },
      );

      then(
        'the glossary lives under briefs/ (the only dir the boot loader pools)',
        () => {
          // the whole point: the glossary must be inside briefs/ or no role
          // ever boots it. assert the canonical dir is nested there, not adjacent
          expect(paths.glossaryDir).toContain(
            '.agent/repo=.this/role=any/briefs/domain.terms',
          );
        },
      );

      then('the created list names every artifact it wrote', () => {
        expect(result.created).toContain(paths.readmeSymlink.at);
        expect(result.created).toContain(paths.ruleSymlinks[0]!.at);
        expect(result.created).toContain(paths.ruleSymlinks[1]!.at);
        expect(result.created).toContain(paths.cacheGitignorePath);
        // the scaffold writes no glossary .gitignore — it is not a consumer concern
        expect(result.created).not.toContain(paths.glossaryGitignorePath);
      });
    });
  });

  given('[case2] a repo whose scaffold already exists', () => {
    const tempDir = genTempDir({ slug: 'test-genDomainTermsScaffold-idem' });

    when('[t0] the scaffold is findserted twice', () => {
      const resultSecond = useThen('the second run succeeds', async () => {
        const cwdBefore = process.cwd();
        process.chdir(tempDir);
        try {
          await genDomainTermsScaffold();
          return await genDomainTermsScaffold();
        } finally {
          process.chdir(cwdBefore);
        }
      });

      then('the second clean run is a no-op (created none)', () => {
        // no drift: the readme already equals canonical, both symlinks already
        // point at `to`, the gitignores exist — every upsert + findsert converges
        // with no write (rule.require.idempotent-operations)
        expect(resultSecond.created).toEqual([]);
      });

      then(
        'a re-pointed readme link is reconciled back to the target on the re-run (upsert)',
        async () => {
          // the readme is a symlink + UPSERT: a link that drifted to a stale target
          // does NOT survive — the next scaffold run re-points it to the declared `to`
          // and reports the readme in `created` (it wrote this run). this is what lets a
          // moved brief refresh every consumer's link, not just fresh installs
          const cwdBefore = process.cwd();
          process.chdir(tempDir);
          try {
            await fs.unlink(path.join(tempDir, paths.readmeSymlink.at));
            await fs.symlink(
              './stale-target.md',
              path.join(tempDir, paths.readmeSymlink.at),
            );
            const result = await genDomainTermsScaffold();
            expect(result.created).toContain(paths.readmeSymlink.at);
          } finally {
            process.chdir(cwdBefore);
          }

          const target = await fs.readlink(
            path.join(tempDir, paths.readmeSymlink.at),
          );
          expect(target).toEqual(paths.readmeSymlink.to);
        },
      );
    });
  });

  given('[case3] two clone-face runs race on a fresh repo', () => {
    const tempDir = genTempDir({ slug: 'test-genDomainTermsScaffold-race' });

    when('[t0] the scaffold is findserted twice concurrently', () => {
      // two parallel clone-face runs on the same checkout is a real scenario
      // (background agents, parallel sessions). the symlink findsert is a
      // check-then-act, so without EEXIST tolerance one run would throw. assert
      // both settle and the scaffold converges (rule.require.idempotent-operations)
      const outcome = useThen('both runs settle', async () => {
        const cwdBefore = process.cwd();
        process.chdir(tempDir);
        try {
          return {
            results: await Promise.allSettled([
              genDomainTermsScaffold(),
              genDomainTermsScaffold(),
            ]),
          };
        } finally {
          process.chdir(cwdBefore);
        }
      });

      then('neither run rejects (EEXIST is tolerated, not thrown)', () => {
        const rejected = outcome.results.filter((r) => r.status === 'rejected');
        expect(rejected).toEqual([]);
      });

      then('the scaffold converged — both rule symlinks exist', async () => {
        for (const link of paths.ruleSymlinks) {
          const target = await fs.readlink(path.join(tempDir, link.at));
          expect(target).toEqual(link.to);
        }
      });

      then(
        'the scaffold converged — the readme link points at its target',
        async () => {
          // the readme is a symlink like the rules; fs.symlink is atomic, so a fresh
          // concurrent create lets exactly one run win and the EEXIST loser converges.
          // what matters is the CONVERGED state: the link ends pointed at its target
          const target = await fs.readlink(
            path.join(tempDir, paths.readmeSymlink.at),
          );
          expect(target).toEqual(paths.readmeSymlink.to);
        },
      );

      then(
        'each race-safe artifact was claimed by exactly one run (EEXIST loser stands down)',
        () => {
          // every artifact is strictly claimed once: genFile's atomic `wx` create and
          // genSymlink's atomic symlink each let exactly one run win, and the EEXIST
          // loser does NOT push to created. the readme is a symlink now too, so it
          // holds this same once-claim invariant — no artifact is exempt
          const claimed = outcome.results.flatMap((r) =>
            r.status === 'fulfilled' ? r.value.created : [],
          );
          const unique = new Set(claimed);
          expect(claimed.length).toEqual(unique.size);
        },
      );
    });
  });
});
