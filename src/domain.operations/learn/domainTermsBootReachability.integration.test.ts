import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { genDomainTermsScaffold } from './genDomainTermsScaffold';
import { genFile } from './genFile';
import { getDomainTermsPaths } from './getDomainTermsPaths';

/**
 * .what = the repo root, where jest runs; the real role=any links live here
 * .why = the glossary boots for role=any only through the committed briefs/
 *        symlink + boot.yml paths + the rule symlinks that link back to the
 *        install-managed brief location (.agent/repo=bhrain/role=learner/briefs,
 *        itself a symlink into dist/ here and node_modules/ in a consumer) — a
 *        tempdir cannot reproduce that chain, so this asserts the real repo
 */
const REPO_ROOT = process.cwd();
const RHACHET_BIN = path.join(REPO_ROOT, 'node_modules/.bin/rhachet');

// boot spawns a child process; give it ample headroom over the 5s default
jest.setTimeout(30_000);

/**
 * .what = boot the role=any resources against the real repo + return stdout
 * .why = the loader only pools files under <role>/briefs/; this exercises the
 *        whole committed chain the way every clone/human boot does
 */
const bootRoleAny = (): string =>
  execSync(`${RHACHET_BIN} roles boot --repo .this --role any`, {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });

describe('domain.terms boot reachability (integration)', () => {
  const paths = getDomainTermsPaths();

  given(
    '[case1] the committed role=any wiring (boot.yml + briefs symlink)',
    () => {
      when('[t0] role=any is booted', () => {
        const result = useThen('boot succeeds', () => ({
          stdout: bootRoleAny(),
        }));

        then('the glossary readme reaches booted context', () => {
          // the vision's central promise: a fresh traveler boots and already
          // speaks the language — the glossary readme is surfaced
          expect(result.stdout).toContain('# domain.terms');
          expect(result.stdout).toContain("the repo's **glossary**");
        });

        then('both governance rules reach booted context by content', () => {
          // assert phrases from the rule BODIES, not just their names (the names
          // also appear in the readme). only a symlink that links through to the
          // real src rule file surfaces this body text — proving the chain holds
          expect(result.stdout).toContain(
            'one concept, one word — everywhere a contract can be read',
          );
          expect(result.stdout).toContain(
            'whose constituent terms are not itemized',
          );
        });

        then(
          'they are reached under briefs/ (the only dir the loader pools)',
          () => {
            // proves the fix: the glossary lives inside briefs/, the only dir the
            // loader pools — not an adjacent dir it would ignore
            expect(result.stdout).toContain(`${paths.glossaryDir}/.readme.md`);
            expect(paths.glossaryDir).toContain('/briefs/domain.terms');
          },
        );
      });
    },
  );

  given('[case2] the boot.yml manifest vs the scaffold paths', () => {
    when('[t0] boot.yml is read', () => {
      const result = useThen('boot.yml is present', async () => ({
        yaml: await fs.readFile(
          path.join(REPO_ROOT, '.agent/repo=.this/role=any/boot.yml'),
          'utf-8',
        ),
      }));

      then(
        'boot.yml declares the same glossary paths the scaffold findserts (one source of truth)',
        () => {
          // closes the triple-duplication loop: boot.yml, getDomainTermsPaths,
          // and the readme must agree on which files rule the glossary. boot.yml
          // uses a role-relative form (strip the role dir prefix)
          const roleDir = '.agent/repo=.this/role=any/';
          const asRoleRelative = (p: string): string => p.replace(roleDir, '');
          expect(result.yaml).toContain(asRoleRelative(paths.readmePath));
          for (const link of paths.ruleSymlinks) {
            expect(result.yaml).toContain(asRoleRelative(link.at));
          }
        },
      );
    });
  });

  given('[case3] a term cluster findserted into the live glossary', () => {
    // the vision's central promise is that the glossary GROWS and every role can
    // then reach the new word. that rests on the per-term boot globs — the only glob
    // entries in any boot.yml in the repo, all under ref so the boot footprint stays
    // fixed as the glossary grows without bound:
    //   ref: term=*._.choice._.md          (each term's choice, surfaced on demand)
    //   ref: term=*._.choice.reason.md      (surfaced on demand)
    // case1 only proved the 3 STATIC say files boot; this exercises the WILDCARDS: it
    // findserts a real sentinel term cluster, boots, then removes it
    const sentinelSlug = '__boottest__';
    const sayPath = path.join(
      REPO_ROOT,
      paths.glossaryDir,
      `term=${sentinelSlug}._.choice._.md`,
    );
    const reasonPath = path.join(
      REPO_ROOT,
      paths.glossaryDir,
      `term=${sentinelSlug}._.choice.reason.md`,
    );

    // the sentinel MUST live in the real committed glossary dir: the boot loader
    // pools term files only from the on-disk role=any/briefs/ chain, and a tempdir
    // boot cannot reproduce the committed briefs symlink + rule symlinks (their
    // install-managed target is absent in a bare tempdir). so the leak hazard is
    // guarded in depth: (1) a beforeAll pre-clean self-heals a crashed prior run,
    // (2) an afterAll always removes it, and (3) a domain.terms/.gitignore excludes
    // `term=__boottest__*` so even a leak between the write and afterAll can never
    // reach git. that .gitignore is THIS TEST's guard, not the shared scaffold's —
    // no consumer writes a __boottest__ sentinel, so its exclusion has no place in a
    // scaffold every repo runs; the beforeAll findserts it here so it self-heals on
    // any checkout (no dependency on a prior file); case4 asserts it holds
    const gitignorePath = path.join(REPO_ROOT, paths.glossaryGitignorePath);

    // pre-clean any sentinel left by a crashed prior run (killed between the write
    // and afterAll — CI timeout, OOM, ctrl-C), run the scaffold, then findsert this
    // test's own leak guard, so a dead run self-heals and the sentinel is protected
    beforeAll(async () => {
      await fs.rm(sayPath, { force: true });
      await fs.rm(reasonPath, { force: true });
      await genDomainTermsScaffold();
      await genFile({ at: gitignorePath, content: 'term=__boottest__*\n' });
    });

    // always remove the sentinel, even if an assertion throws — the live glossary
    // is a committed dir; a leaked test file must never survive the run
    afterAll(async () => {
      await fs.rm(sayPath, { force: true });
      await fs.rm(reasonPath, { force: true });
    });

    when('[t0] the term cluster is present and role=any is booted', () => {
      const result = useThen(
        'boot succeeds with the sentinel term written',
        async () => {
          await fs.writeFile(
            sayPath,
            [
              '# domain.term: __boottest__',
              '',
              'term.chosen = __boottest__',
              'term.kind   = noun',
              '',
              '## .what',
              'a sentinel term that proves the wildcard say-glob pools real term files.',
              '',
            ].join('\n'),
            'utf-8',
          );
          await fs.writeFile(
            reasonPath,
            [
              '# domain.term.choice.reason: __boottest__',
              '',
              '## .etymology',
              'sentinel-only; proves the ref-level cluster glob surfaces on demand.',
              '',
            ].join('\n'),
            'utf-8',
          );
          return { stdout: bootRoleAny() };
        },
      );

      then(
        'the say-level choice surfaces on demand via its wildcard ref glob',
        () => {
          // proves `term=*._.choice._.md` pools a real, newly-added term as an
          // on-demand ref pointer — its PATH surfaces (not its full content), so a
          // glossary that grows never inflates the always-booted say footprint, while
          // the term stays reachable the moment a traveler needs it
          expect(result.stdout).toContain(`term=${sentinelSlug}._.choice._.md`);
        },
      );

      then('the ref-level reason surfaces via its explicit ref glob', () => {
        // proves `term=*._.choice.reason.md` is booted deliberately (a ref path),
        // not left to the <also> fallback — the vision's "surfaced on demand"
        expect(result.stdout).toContain(
          `term=${sentinelSlug}._.choice.reason.md`,
        );
      });
    });
  });

  given('[case4] the test-owned leak-guard for case3', () => {
    // case3 must write its __boottest__ sentinel into the REAL glossary dir (the boot
    // loader pools only the on-disk chain; a tempdir cannot reproduce the committed
    // symlinks). the domain.terms/.gitignore is the last-line filesystem backstop:
    // even if case3's process is killed before afterAll, a leaked sentinel can never
    // reach git. this guard is OWNED BY THIS TEST, not the shared scaffold — the
    // __boottest__ sentinel exists only here, so a scaffold every consumer runs has no
    // business with a rule for it. this case findserts the guard, then asserts it holds
    // — no dependency on a prior file, verifiable entirely in the .ts review scope
    const gitignorePath = path.join(REPO_ROOT, paths.glossaryGitignorePath);

    // findsert this test's own leak guard on any checkout (idempotent no-op when
    // already present), so the read below never ENOENTs
    beforeAll(async () => {
      await genFile({ at: gitignorePath, content: 'term=__boottest__*\n' });
    });

    when('[t0] the test-owned glossary .gitignore is read', () => {
      const result = useThen('it is present', async () => ({
        content: await fs.readFile(gitignorePath, 'utf-8'),
      }));

      then('it excludes the case3 boot-test sentinel prefix', () => {
        // matches `term=__boottest__._.choice._.md` + `.reason.md` a killed run
        // could leave behind, so they can never be committed as cruft
        expect(result.content).toContain('term=__boottest__');
      });
    });
  });

  given(
    '[case5] the committed .readme.md is a symlink into the learner briefs',
    () => {
      // the readme is a symlink like the two rules — its source of truth is a learner
      // brief, linked back via the install-managed target. the scaffold reconciles the
      // committed link on every run (upsert). this guard confirms the committed artifact
      // IS a symlink pointed at the declared target, and that it RESOLVES through the
      // install chain to the real glossary explainer — so a reword to the brief reaches
      // every consumer's glossary with no regeneration step
      const readmePath = path.join(REPO_ROOT, paths.readmePath);

      // reconcile the committed readme link to its target (idempotent no-op when equal)
      beforeAll(async () => {
        await genDomainTermsScaffold();
      });

      when('[t0] the committed readme is inspected', () => {
        const result = useThen('it is present', async () => ({
          link: await fs.lstat(readmePath),
          target: await fs.readlink(readmePath),
          content: await fs.readFile(readmePath, 'utf-8'),
        }));

        then('it is a symlink pointed at the declared target', () => {
          expect(result.link.isSymbolicLink()).toEqual(true);
          expect(result.target).toEqual(paths.readmeSymlink.to);
        });

        then(
          'it resolves through the install chain to the glossary explainer',
          () => {
            // a read through the live link proves the whole chain holds end-to-end:
            // .readme.md → install-managed briefs → dist → the source brief content
            expect(result.content).toContain('# domain.terms');
            expect(result.content).toContain("the repo's **glossary**");
          },
        );
      });
    },
  );
});
