import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import {
  getGuardPeerReviews,
  getGuardSelfReviews,
} from '@src/domain.objects/Driver/RouteStoneGuard';

import { parseStoneGuard } from './parseStoneGuard';

const ASSETS_DIR = path.join(__dirname, '../.test/assets');

/**
 * .what = integration coverage for parseStoneGuard's { content, path } variant
 * .why = these cases touch the filesystem boundary on purpose — parity requires a
 *        real disk read of a fixture guard, and @path expansion requires temp files
 *        on disk to prove disk-relative resolution. per
 *        rule.forbid.unit.remote-boundaries, boundary-touching cases live in an
 *        integration file, not the unit .test.ts.
 */
describe('parseStoneGuard.integration', () => {
  given('[case-content-variant] the { content, path } input variant', () => {
    const guardPath = path.join(
      ASSETS_DIR,
      'route.peer.budget',
      '1.vision.guard',
    );

    when('[t0] the same guard is parsed both ways', () => {
      then(
        'the { content } variant yields a result equal to the { path } variant',
        async () => {
          const fromPath = await parseStoneGuard({ path: guardPath });
          const bytes = await fs.readFile(guardPath, 'utf-8');
          const fromContent = await parseStoneGuard({
            content: bytes,
            path: guardPath,
          });
          // parity: the file's own bytes as content yield the identical object
          expect(fromContent).toEqual(fromPath);
        },
      );
    });

    when('[t1] a template with an @path say-ref is parsed via content', () => {
      then(
        'the @path expands against the path arg dir (guardDir), not the cwd',
        async () => {
          // a template dir holds a guard whose self-review say is `@brief.md`, plus a
          // peer brief.md. a parse of IN-MEMORY content with path pointed at that dir
          // must expand the ref against that dir (proves guardDir = dirname(path)).
          const tmplDir = await fs.mkdtemp(
            path.join(os.tmpdir(), 'test-guard-content-atpath-'),
          );
          await fs.writeFile(
            path.join(tmplDir, 'brief.md'),
            'the peer brief content',
          );
          const tmplGuardPath = path.join(tmplDir, '5.1.execution.guard');
          const content = `reviews:
  self:
    - slug: reflect
      say: @brief.md
judges:
  - rhx judge --mechanism reviewed?
`;
          const result = await parseStoneGuard({
            content,
            path: tmplGuardPath,
          });
          const selfReviews = getGuardSelfReviews(result);
          expect(selfReviews).toHaveLength(1);
          expect(selfReviews[0]?.say).toContain('the peer brief content');
          // the object path is the source path we supplied
          expect(result.path).toEqual(tmplGuardPath);
        },
      );
    });
  });

  given('[case19] an `@path` say-ref that cannot be read', () => {
    // 🔴 .why = this refusal existed and was UNCLAMPED — the happy path in
    //           `[t1]` above proves an @path expands, and no case proved what a
    //           driver reads when it cannot. so its message could regress to a
    //           bare symptom and every test would stay green
    //
    // 🔴 .the defect it now pins = the catch discarded `error` outright, so an
    //     absent file, a directory, and a permissions fault produced ONE
    //     sentence. a driver told "failed to expand @path reference: x.md"
    //     cannot tell which fix to apply (`rule.require.errors-name-the-fix`).
    //     raised as a blocker by TWO independent lanes at i032 (r6, r10)
    //
    // 🔴 .why it sits HERE and not in `parseStoneGuard.test.ts` = the ENOENT is
    //     real. it exists only because a real `fs.readFile` was attempted, which
    //     is the filesystem boundary `rule.forbid.unit.remote-boundaries`
    //     classifies as remote. it was authored into the unit file and moved at
    //     i020/r9, which caught it
    //
    // ✅ .teeth = MEASURED 2026-09-16. revert the message to its bare form and
    //     both then-blocks go red — `/ENOENT/` in `[t0]` and the directory
    //     clause in `[t1]` — while `[t0]`'s FIRST assertion still passes.
    //     ⇒ that split IS the defect: the refusal still fires, it merely stops
    //     to say why. the loud half was always fine, which is why four rounds
    //     of review could name it and no test could catch it

    const content = `reviews:
  self:
    - slug: has-questioned-assumptions
      say: "@brief-that-does-not-exist.md"
`;

    /** .what = a real, empty dir — so the absent ref is absent on real disk */
    const genGuardPath = async (): Promise<string> => {
      const dir = await fs.mkdtemp(
        path.join(os.tmpdir(), 'test-guard-atpath-enoent-'),
      );
      return path.join(dir, '1.vision.guard');
    };

    when('[t0] the ref points at no file', () => {
      then('the parse refuses, and the refusal names the CAUSE', async () => {
        const guardPath = await genGuardPath();

        await expect(
          parseStoneGuard({ content, path: guardPath }),
        ).rejects.toThrow(/failed to expand @path reference/);

        // 🔴 the fs code is what parts an absent file from a permissions fault
        await expect(
          parseStoneGuard({ content, path: guardPath }),
        ).rejects.toThrow(/ENOENT/);
      });
    });

    when('[t1] the driver reads it to find the fix', () => {
      then('the refusal names where the ref resolves FROM', async () => {
        // .why = a ref written from the repo root rather than from the guard's
        //        own directory is the most common way to earn this ENOENT, and
        //        the bare message named neither directory
        const guardPath = await genGuardPath();
        const guardDir = path.dirname(guardPath);

        await expect(
          parseStoneGuard({ content, path: guardPath }),
        ).rejects.toThrow(`guard's own directory (${guardDir})`);
      });
    });
  });

  given('[case-dup-slugs] flat reviews with duplicate slugs', () => {
    when('[t0] multiple peer reviews derive same slug from cmd', () => {
      then('slugs are standardized to be unique via .N suffix', async () => {
        // create temp guard with duplicate slugs
        const tempDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'test-guard-dup-slug-'),
        );
        const guardFile = path.join(tempDir, '1.test.guard');
        // all three commands start with $rhx, so derived slugs would collide
        await fs.writeFile(
          guardFile,
          `artifacts:
  - src/**/*
reviews:
  - $rhx --rules briefs/arch.md
  - $rhx --rules briefs/ergo.md
  - $rhx --rules briefs/mech.md
`,
        );

        const result = await parseStoneGuard({ path: guardFile });
        const peerReviews = getGuardPeerReviews(result);

        expect(peerReviews).toHaveLength(3);
        // each slug should have .N suffix since they all derived from $rhx
        expect(peerReviews[0]?.slug).toEqual('$rhx.1');
        expect(peerReviews[1]?.slug).toEqual('$rhx.2');
        expect(peerReviews[2]?.slug).toEqual('$rhx.3');
      });

      then('unique slugs are left as-is', async () => {
        // create temp guard with unique slugs
        const tempDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'test-guard-unique-slug-'),
        );
        const guardFile = path.join(tempDir, '1.test.guard');
        await fs.writeFile(
          guardFile,
          `artifacts:
  - src/**/*
reviews:
  - arch-review --rules briefs/arch.md
  - ergo-review --rules briefs/ergo.md
  - mech-review --rules briefs/mech.md
`,
        );

        const result = await parseStoneGuard({ path: guardFile });
        const peerReviews = getGuardPeerReviews(result);

        expect(peerReviews).toHaveLength(3);
        // unique slugs should not have suffix
        expect(peerReviews[0]?.slug).toEqual('arch-review');
        expect(peerReviews[1]?.slug).toEqual('ergo-review');
        expect(peerReviews[2]?.slug).toEqual('mech-review');
      });
    });
  });

  given(
    '[case-slug-uniqueness] a slug shared by a self AND a peer reviewer',
    () => {
      when('[t0] guard is parsed', () => {
        then(
          'throws a loud BadRequestError that names the duplicate slug',
          async () => {
            const tempDir = await fs.mkdtemp(
              path.join(os.tmpdir(), 'test-guard-slug-collision-'),
            );
            const guardFile = path.join(tempDir, '1.test.guard');
            await fs.writeFile(
              guardFile,
              `reviews:
  self:
    - slug: architect
      say: "review it"
  peer:
    - slug: architect
      run: rhx review --rules briefs/arch.md
judges:
  - rhx judge --mechanism reviewed?
`,
            );

            await expect(parseStoneGuard({ path: guardFile })).rejects.toThrow(
              'architect',
            );
          },
        );
      });
    },
  );

  given('[case-slug-distinct] distinct self + peer slugs', () => {
    when('[t0] guard is parsed', () => {
      then('parses without error', async () => {
        const tempDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'test-guard-slug-distinct-'),
        );
        const guardFile = path.join(tempDir, '1.test.guard');
        await fs.writeFile(
          guardFile,
          `reviews:
  self:
    - slug: reflect
      say: "review it"
  peer:
    - slug: architect
      run: rhx review --rules briefs/arch.md
judges:
  - rhx judge --mechanism reviewed?
`,
        );

        const result = await parseStoneGuard({ path: guardFile });
        expect(getGuardSelfReviews(result)).toHaveLength(1);
        expect(getGuardPeerReviews(result)).toHaveLength(1);
      });
    });
  });
});
