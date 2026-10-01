import { genTempDir, given, then, useThen, when } from 'test-fns';

import * as fs from 'node:fs';
import * as path from 'node:path';
import { genBrainApplyLog } from './genBrainApplyLog';

/**
 * .what = pins WHICH fault class the apply-log open may absorb
 * .why = `dispatchBrainSwitch` calls this op synchronously and returns to `setStoneBrain`,
 *        which renders a halt a human reads; so a foreign fault must TRAVEL rather than read
 *        as a benign absence (`rule.forbid.failhide`)
 *
 * .note = the two cases are peers, each pins a half the other cannot:
 *   - `[case2]` — the ABSENCE class degrades to `null`
 *   - `[case3]` — a FOREIGN class travels
 *
 * ✅ .teeth = with the allowlist disabled, both `[case3]` rows go red; with the catch
 *   removed, `[case2]` goes red
 */
describe('genBrainApplyLog', () => {
  given('[case1] a repo root whose .log path is writable', () => {
    when('[t0] the log is opened', () => {
      const scene = useThen('it opens', () => {
        const repoRoot = genTempDir({ slug: 'gen-log-c1', git: true });
        const log = genBrainApplyLog({ repoRoot });
        return { repoRoot, log };
      });

      then('it hands back a descriptor and the path it opened', () => {
        expect(scene.log).not.toEqual(null);
        expect(typeof scene.log?.fd).toEqual('number');
        expect(scene.log?.path).toEqual(
          path.join(scene.repoRoot, '.log', 'bhrain', 'brain', 'apply.log'),
        );
      });

      then('the file is APPEND-mode — a second open keeps prior bytes', () => {
        // .why = the op runs once per onStop tick while a stone is parked; a truncate would
        //        erase the trail an operator reaches for. `'a'` keeps the log cumulative
        fs.writeSync(scene.log!.fd, 'first\n');
        fs.closeSync(scene.log!.fd);

        const again = genBrainApplyLog({ repoRoot: scene.repoRoot });
        fs.writeSync(again!.fd, 'second\n');
        fs.closeSync(again!.fd);

        expect(fs.readFileSync(scene.log!.path, 'utf-8')).toEqual(
          'first\nsecond\n',
        );
      });
    });
  });

  given('[case2] a repo root whose .log path is a FILE', () => {
    // .why ENOTDIR = absence-shaped ("no writable log here"), deterministic, and reached
    //    hermetically: `mkdirSync` over a regular `.log` file (`rule.forbid.bare-host-deps`)
    when('[t0] the log is opened', () => {
      const scene = useThen('it degrades', () => {
        const repoRoot = genTempDir({ slug: 'gen-log-c2', git: true });
        fs.writeFileSync(path.join(repoRoot, '.log'), 'not a directory');
        return { repoRoot, log: genBrainApplyLog({ repoRoot }) };
      });

      then('it returns null rather than throws', () => {
        // .why = with no catch this throws into `child.on('error')` via `setBrainApplyNote`,
        //    uncaught, which would skip the settle and hang the halt
        expect(scene.log).toEqual(null);
      });

      then('and the absorbed class is the one the header names', () => {
        // .why the RAW call = the op returns `null` for this class either way, so the class
        //      is proven at the source; if node stops to raise ENOTDIR here, this goes red
        let code: string | null = null;
        try {
          fs.mkdirSync(path.join(scene.repoRoot, '.log', 'bhrain', 'brain'), {
            recursive: true,
          });
        } catch (error) {
          code = (error as { code?: string }).code ?? null;
        }
        expect(code).toEqual('ENOTDIR');
      });
    });
  });

  given('[case3] a repo root where the apply.log PATH is a directory', () => {
    // .why EISDIR = FOREIGN (not on `isBrainApplyLogAbsence`'s list) and reachable
    //    hermetically, where `ENOSPC` / `EMFILE` / `EIO` are not: a directory sits where
    //    the log file goes, so `openSync(_, 'a')` raises
    // 🔴 .why = under a bare catch this returns `null`, identical to `[case2]` — the failhide
    when('[t0] the log is opened', () => {
      const scene = useThen('the tree is prepared', () => {
        const repoRoot = genTempDir({ slug: 'gen-log-c3', git: true });
        fs.mkdirSync(
          path.join(repoRoot, '.log', 'bhrain', 'brain', 'apply.log'),
          {
            recursive: true,
          },
        );
        return { repoRoot };
      });

      then('the foreign fault TRAVELS rather than degrades', () => {
        expect(() => genBrainApplyLog({ repoRoot: scene.repoRoot })).toThrow();
      });

      then('and it carries the code an operator acts on', () => {
        let code: string | null = null;
        try {
          genBrainApplyLog({ repoRoot: scene.repoRoot });
        } catch (error) {
          code = (error as { code?: string }).code ?? null;
        }
        expect(code).toEqual('EISDIR');
      });
    });
  });
});
