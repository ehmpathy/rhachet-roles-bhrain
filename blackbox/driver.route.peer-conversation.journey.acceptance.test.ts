import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-peer-conversation-journey',
);

/**
 * .what = end-to-end journey for the peer-review conversation loop (t0→t7)
 * .why = the matrix-split acceptance files each isolate ONE boundary (gate,
 *        absent, visibility, staleness); none proves the whole loop converges
 *        as a lived flow. this journey drives the complete two-iteration
 *        conversation and snapshots each checkpoint — the vision's timeline
 *        made executable (blueprint 3.3.1 "journey acceptance test").
 *
 * scenario:
 *   - guard has two peer reviewers: architect (--conversation) + mechanic (clean)
 *   - judge allows 1 blocker, so judges pass and the contemplation gate engages
 *   - the driver contemplates architect, the stone passes, then the artifact
 *     changes; architect re-runs WITH --conversation, sees the FIXED .taken, and
 *     drops the blocker — the loop converges without a fresh contemplation
 */
describe('driver.route.peer-conversation.journey.acceptance', () => {
  given('[case1] a stone gated on architect (--conversation) + mechanic (clean)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-conversation-journey',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-conversation.sh', {
        cwd: tempDir,
      });
      await execAsync('chmod +x .test/mock-review-clean.sh', { cwd: tempDir });
      await fs.writeFile(
        path.join(tempDir, '1.execute.md'),
        '# execute\n\nthe work under review — round one.\n',
      );
      return { tempDir };
    });

    const peerDir = () => path.join(scene.tempDir, '.reviews', 'peer');

    // helper: read an architect given whose content matches a predicate
    const readArchitectGiven = async (
      match: (content: string) => boolean,
    ): Promise<string> => {
      const files = await fs.readdir(peerDir());
      for (const name of files) {
        if (
          !name.includes('_.given.by_peer.architect.md') ||
          name.endsWith('.report.md')
        )
          continue;
        const content = await fs.readFile(path.join(peerDir(), name), 'utf-8');
        if (match(content)) return content;
      }
      throw new Error('no architect given matched the predicate');
    };

    when('[t0] driver arrives; guard runs both reviewers', () => {
      const result = useThen('guard runs, blocks on contemplation', async () => {
        const invoked = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'arrived' },
          cwd: scene.tempDir,
        });
        const architect = await readArchitectGiven((c) =>
          c.includes('conversation seen'),
        );
        return { invoked, architect };
      });

      then('is blocked on contemplation (exit 2)', () => {
        expect(result.invoked.code).toEqual(2);
      });

      then('architect raised 1 blocker with an empty first-round conversation', () => {
        expect(result.architect).toContain('blockers: 1');
        expect(result.architect).toContain('## conversation seen (0 files)');
      });

      then('the reply-prompt names architect only (mechanic clean → skipped)', () => {
        expect(result.invoked.stdout).toContain('the reviewers await your reply');
        expect(result.invoked.stdout).toContain('architect');
        expect(result.invoked.stdout).not.toContain('slug = mechanic');
      });

      then('[t0] stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.invoked.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] driver attempts --as passed with no .taken', () => {
      const result = useThen('the same reply-prompt blocks passage', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('is blocked (exit 2)', () => {
        expect(result.code).toEqual(2);
      });

      then('the reply-prompt names architect and the paths to read + write', () => {
        expect(result.stdout).toContain('the reviewers await your reply');
        expect(result.stdout).toContain('architect');
        expect(result.stdout).toContain('_.given.by_peer.architect.md');
        expect(result.stdout).toContain('_.taken.by_self.architect.md');
      });

      then('[t1] stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] driver signals --as contemplated before the .taken exists', () => {
      const result = useThen('the guard blocks with absent guidance', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.execute',
            route: '.',
            as: 'contemplated',
            that: 'architect',
          },
          cwd: scene.tempDir,
        }),
      );

      then('is blocked (exit 2)', () => {
        expect(result.code).toEqual(2);
      });

      then('names the exact absent .taken path and why it is required', () => {
        expect(result.stdout).toContain(
          'contemplation absent for reviewer architect',
        );
        expect(result.stdout).toContain('_.taken.by_self.architect.md');
        expect(result.stdout).toContain('the .taken file IS that engagement');
      });

      then('[t2] stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t3] driver writes the FIXED .taken then contemplates architect', () => {
      const result = useThen('the guard records the contemplation', async () => {
        // pair architect's current given → its taken, claim FIXED
        const files = await fs.readdir(peerDir());
        const givenName = files.find(
          (f) =>
            f.includes('_.given.by_peer.architect.md') &&
            !f.endsWith('.report.md'),
        )!;
        const takenName = givenName.replace(
          '._.given.by_peer.',
          '._.taken.by_self.',
        );
        await fs.writeFile(
          path.join(peerDir(), takenName),
          '# taken\n\nFIXED via a bounded context.\n',
        );
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.execute',
            route: '.',
            as: 'contemplated',
            that: 'architect',
          },
          cwd: scene.tempDir,
        });
      });

      then('is acknowledged (exit 0)', () => {
        expect(result.code).toEqual(0);
      });

      then('confirms the contemplation was recorded', () => {
        expect(result.stdout).toContain('contemplated: architect');
      });

      then('[t3] stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t4] driver attempts --as passed with architect answered', () => {
      const result = useThen('the stone progresses', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('passes (exit 0)', () => {
        expect(result.code).toEqual(0);
      });

      then('the stone is allowed passage', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('[t4] stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t5] the artifact changes; architect re-runs WITH --conversation', () => {
      const result = useThen('architect converges — drops the blocker', async () => {
        // change the artifact → new hash → the guard re-runs architect, and
        // this time it consumes the prior .given + FIXED .taken via --conversation
        await fs.writeFile(
          path.join(scene.tempDir, '1.execute.md'),
          '# execute\n\nthe work under review — round two, edited.\n',
        );
        const invoked = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        const architect = await readArchitectGiven((c) =>
          c.includes('the blocker is dropped'),
        );
        return { invoked, architect };
      });

      then('architect saw the prior conversation and dropped the blocker (0)', () => {
        expect(result.architect).toContain('blockers: 0');
        expect(result.architect).toContain("the driver's .taken claims FIXED");
        expect(result.architect).toContain('_.taken.by_self.architect.md');
      });

      then('the converged clean review needs no fresh .taken — passage allowed', () => {
        expect(result.invoked.code).toEqual(0);
        expect(result.invoked.stdout).toContain('passage = allowed');
      });

      then('[t5] stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.invoked.stdout)).toMatchSnapshot();
      });
    });

    when('[t6] driver re-attempts --as passed post-convergence', () => {
      const result = useThen('the converged stone stays passable', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('still passes with no new .taken (exit 0)', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('passage = allowed');
      });

      then('[t6] stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t7] the review dir holds a legible given↔taken transcript', () => {
      const result = useThen('the conversation is a paired transcript', async () => {
        const files = await fs.readdir(peerDir());
        // keep the conversation .md files (drop the .report.md siblings)
        const transcript = files
          .filter(
            (f) =>
              (f.includes('_.given.by_peer.') ||
                f.includes('_.taken.by_self.')) &&
              !f.endsWith('.report.md'),
          )
          // scrub the volatile hash so the transcript snapshot is stable
          .map((f) => f.replace(/\.i\d+\.[0-9a-f]+\.r\d+\./, '.i[N].[HASH].r[N].'))
          .sort()
          // join to a single string so assertions run on a value, not a proxy
          .join('\n');
        // wrap in an object so property access yields the real string (the
        // useThen proxy is not itself a string primitive)
        return { transcript };
      });

      then('architect has BOTH a given and a paired taken (the dialogue)', () => {
        expect(result.transcript).toContain('_.given.by_peer.architect.md');
        expect(result.transcript).toContain('_.taken.by_self.architect.md');
      });

      then('[t7] transcript matches snapshot', () => {
        expect(result.transcript).toMatchSnapshot();
      });
    });
  });
});
