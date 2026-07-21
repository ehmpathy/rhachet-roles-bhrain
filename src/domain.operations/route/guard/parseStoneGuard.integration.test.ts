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
