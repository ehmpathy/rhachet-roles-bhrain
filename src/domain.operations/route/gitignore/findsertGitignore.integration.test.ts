import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, when } from 'test-fns';

import { findsertGitignore } from './findsertGitignore';
import { findsertReviewPeerGitignore } from './findsertReviewPeerGitignore';
import { findsertReviewSelfGitignore } from './findsertReviewSelfGitignore';
import { findsertRouteGitignore } from './findsertRouteGitignore';

const CONTENT = `# ignore all
*
!.gitignore
`;

describe('findsertGitignore', () => {
  given('[case1] a directory that does not exist yet', () => {
    when('[t0] findserted', () => {
      then(
        'it creates the dir and the file, and reports `created`',
        async () => {
          const tempDir = genTempDir({ slug: 'gitignore-fresh' });
          const dir = path.join(tempDir, 'deep', 'nested');

          const result = await findsertGitignore({ dir, content: CONTENT });

          expect(result.action).toEqual('created');
          expect(await fs.readFile(result.path, 'utf-8')).toEqual(CONTENT);
        },
      );
    });
  });

  given('[case2] a directory whose gitignore already holds the content', () => {
    when('[t0] findserted a second time', () => {
      then('it CONVERGES — `unchanged`, and no write', async () => {
        // .why = this is the whole idempotency claim. it is what makes two
        //        concurrent writers of the same bytes benign, so it is the
        //        property the per-lane call site leaned on
        const dir = genTempDir({ slug: 'gitignore-idem' });

        const first = await findsertGitignore({ dir, content: CONTENT });
        expect(first.action).toEqual('created');

        const second = await findsertGitignore({ dir, content: CONTENT });
        expect(second.action).toEqual('unchanged');
        expect(second.path).toEqual(first.path);
      });
    });
  });

  given('[case3] a gitignore whose content has drifted', () => {
    when('[t0] findserted', () => {
      then('it overwrites, and reports `created`', async () => {
        const dir = genTempDir({ slug: 'gitignore-drift' });
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, '.gitignore'), 'stale\n');

        const result = await findsertGitignore({ dir, content: CONTENT });

        expect(result.action).toEqual('created');
        expect(await fs.readFile(result.path, 'utf-8')).toEqual(CONTENT);
      });
    });
  });

  given('[case4] the gitignore PATH is occupied by a directory', () => {
    // .why = 🔴 THE regression clamp. `findsertRouteGitignore` alone swallowed
    //        every read error via `.catch(() => null)`, so an EISDIR read as
    //        "absent" and the write then failed elsewhere, or the ignore quietly
    //        never landed. its two peers rethrew. one body now serves all three,
    //        and this is the assertion that keeps the rethrow in it
    when('[t0] findserted', () => {
      then(
        'it RETHROWS the READ fault, never the write that follows',
        async () => {
          // 🔴 .why the syscall is asserted and not merely `.rejects.toThrow()` =
          //        a bare throw assertion has NO TEETH here. under the failhide the
          //        EISDIR is swallowed, `contentFound` reads as `null`, and the
          //        `writeFile` onto that same directory path throws EISDIR anyway —
          //        so the test passes either way and clamps naught.
          //        measured: the loose form went GREEN under a reverted rethrow,
          //        while the two sibling suites went red. the syscall is the one
          //        field that parts the two faults:
          //          rethrown  → readFile on a dir  ⇒ syscall `read`
          //          swallowed → writeFile on a dir ⇒ syscall `open`
          const dir = genTempDir({ slug: 'gitignore-eisdir' });
          await fs.mkdir(path.join(dir, '.gitignore'), { recursive: true });

          const error = await findsertGitignore({ dir, content: CONTENT }).then(
            () => null,
            (caught: NodeJS.ErrnoException) => caught,
          );

          expect(error).not.toEqual(null);
          expect(error?.code).toEqual('EISDIR');
          expect(error?.syscall).toEqual('read');
          expect(error?.syscall).not.toEqual('open');
        },
      );
    });
  });

  given('[case5] the three named callers', () => {
    // .why = the copies drifted on error rethrow AND on hoist. one body closes
    //        the first axis by construction; these assert each caller still
    //        writes its own content, at its own path, so the collapse changed
    //        no observable behavior
    when('[t0] each is findserted against one route', () => {
      then('each lands at its own path with its own content', async () => {
        const route = genTempDir({ slug: 'gitignore-callers' });

        const routeResult = await findsertRouteGitignore({ route });
        const peerResult = await findsertReviewPeerGitignore({ route });
        const selfResult = await findsertReviewSelfGitignore({ route });

        expect(routeResult.path).toEqual(
          path.join(route, '.route', '.gitignore'),
        );
        expect(peerResult.path).toEqual(
          path.join(route, '.reviews', 'peer', '.gitignore'),
        );
        expect(selfResult.path).toEqual(
          path.join(route, 'review', 'self', '.gitignore'),
        );

        // the route ignore is the one that must keep passage.jsonl tracked
        const routeContent = await fs.readFile(routeResult.path, 'utf-8');
        expect(routeContent).toContain('!passage.jsonl');
        expect(routeContent).toContain('!.bind.*');

        // the two review ignores hide every artifact but themselves
        expect(await fs.readFile(peerResult.path, 'utf-8')).not.toContain(
          'passage.jsonl',
        );
        expect(await fs.readFile(selfResult.path, 'utf-8')).not.toContain(
          'passage.jsonl',
        );
      });

      then('each CONVERGES on a re-run', async () => {
        const route = genTempDir({ slug: 'gitignore-callers-idem' });

        await findsertRouteGitignore({ route });
        await findsertReviewPeerGitignore({ route });
        await findsertReviewSelfGitignore({ route });

        expect((await findsertRouteGitignore({ route })).action).toEqual(
          'unchanged',
        );
        expect((await findsertReviewPeerGitignore({ route })).action).toEqual(
          'unchanged',
        );
        expect((await findsertReviewSelfGitignore({ route })).action).toEqual(
          'unchanged',
        );
      });
    });
  });
});
