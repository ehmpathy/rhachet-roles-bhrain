import { genTempDir, given, then, useThen, when } from 'test-fns';

import * as fs from 'node:fs';
import * as path from 'node:path';
import { delBrainApplyLogHandoff } from './delBrainApplyLogHandoff';

/**
 * .what = pins the release, its idempotency, and the ONE fault class its swallow absorbs
 * .why = this runs after `uv_spawn` has dup'd the descriptor, so the dispatch has already
 *        SUCCEEDED; a rethrow would kill the driver hook on a healthy switch, since no
 *        caller up the chain catches. so the swallow stays, and `[case2]` makes its class
 *        checkable
 *
 * .teeth = remove the `catch` → `[case2]` red (the second call throws EBADF)
 */
describe('delBrainApplyLogHandoff', () => {
  given('[case1] a descriptor handed to an already-forked child', () => {
    when('[t0] the parent copy is released', () => {
      const scene = useThen('it releases', () => {
        const repoRoot = genTempDir({ slug: 'handoff-c1', git: true });
        const file = path.join(repoRoot, 'apply.log');
        const fd = fs.openSync(file, 'a');
        delBrainApplyLogHandoff({ log: { fd, path: file } });
        return { fd, file };
      });

      then('the descriptor is CLOSED — a write on it now refuses', () => {
        // .why = `fs.openSync` returns an fd into THIS process's table, and a child's dup is
        //    a separate reference; skip the close and one fd leaks per dispatch
        let code: string | null = null;
        try {
          fs.writeSync(scene.fd, 'after the close');
        } catch (error) {
          code = (error as { code?: string }).code ?? null;
        }
        expect(code).toEqual('EBADF');
      });
    });
  });

  given('[case2] a release that runs a SECOND time on one fd', () => {
    // .why it is reachable = the op is called unconditionally after `spawn()`, and a driver
    //      hook is re-entered per onStop tick. a re-run must converge rather than throw
    //      (`rule.require.idempotent-operations`)
    when('[t0] it is released twice', () => {
      then('the second call converges rather than throws', () => {
        const repoRoot = genTempDir({ slug: 'handoff-c2', git: true });
        const file = path.join(repoRoot, 'apply.log');
        const fd = fs.openSync(file, 'a');

        delBrainApplyLogHandoff({ log: { fd, path: file } });

        expect(() =>
          delBrainApplyLogHandoff({ log: { fd, path: file } }),
        ).not.toThrow();
      });

      then('and EBADF is the class it absorbed — named, not assumed', () => {
        // .why the RAW close = the op returns void and cannot report the class; if node stops
        //      to raise EBADF on a double close, this goes red
        const repoRoot = genTempDir({ slug: 'handoff-c2b', git: true });
        const fd = fs.openSync(path.join(repoRoot, 'apply.log'), 'a');
        fs.closeSync(fd);

        let code: string | null = null;
        try {
          fs.closeSync(fd);
        } catch (error) {
          code = (error as { code?: string }).code ?? null;
        }
        expect(code).toEqual('EBADF');
      });
    });
  });
});
