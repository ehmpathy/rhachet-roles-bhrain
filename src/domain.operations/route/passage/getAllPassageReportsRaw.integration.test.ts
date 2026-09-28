import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, useBeforeAll, when } from 'test-fns';

import { genRouteWithPassage } from '../.test/genRouteWithPassage';
import { asNodeErrnoCode } from '../asNodeErrnoCode';
import { getAllPassageReportsRaw } from './getAllPassageReportsRaw';

/**
 * .what = integration cases for getAllPassageReportsRaw
 * .why = this is the ONE shared parser the three passage reads build on
 *        (getLatestPassageForStone, getAllLatestPassageByStone, getAllPassageReports).
 *        it must return entries VERBATIM in file order — no dedup, no re-bucket — so the
 *        three consumers can each apply their own reduction without a divergent parse.
 */

describe('getAllPassageReportsRaw.integration', () => {
  given('[case1] no passage file exists', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'all-raw-none-'));
      return { route };
    });

    when('[t0] the raw entries are read', () => {
      then('returns an empty list', async () => {
        const raw = await getAllPassageReportsRaw({ route: scene.route });
        expect(raw).toEqual([]);
      });
    });
  });

  given('[case2] a file with repeated + sticky-kind entries', () => {
    // the raw read must NOT dedup or re-bucket: every line comes back, in order
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [
          { stone: '1.vision', status: 'blocked' },
          { stone: '1.vision', status: 'approved' },
          { stone: '2.plan', status: 'malfunction' },
          { stone: '1.vision', status: 'passed' },
        ],
      }),
    );

    when('[t0] the raw entries are read', () => {
      then('returns every entry verbatim, in file order', async () => {
        const raw = await getAllPassageReportsRaw({ route: scene.route });
        expect(raw).toHaveLength(4);
        expect(raw.map((r) => [r.stone, r.status])).toEqual([
          ['1.vision', 'blocked'],
          ['1.vision', 'approved'],
          ['2.plan', 'malfunction'],
          ['1.vision', 'passed'],
        ]);
      });
    });
  });

  given('[case3] a file whose last line is torn/partial', () => {
    // a partial append (a torn final line) is plausible on an append-only log the reminder
    // daemon reads every ~20min. the shared parser must fail LOUD, with the torn line + a fix
    // hint (rule.require.failloud), never a cryptic bare `SyntaxError`. crash-loud is U3-safe: the
    // daemon dies rather than misread a route status. this clamps that behavior
    // (rule.require.clamp-edge-cases) — RED under a bare `JSON.parse` (a raw SyntaxError with no
    // path/line/hint), GREEN under the failloud wrap.
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'all-raw-torn-'));
      const passagePath = path.join(route, '.route', 'passage.jsonl');
      await fs.mkdir(path.dirname(passagePath), { recursive: true });
      // one good line, then a torn json object (a partial append)
      await fs.writeFile(
        passagePath,
        '{"stone":"1.vision","status":"passed"}\n{"stone":"1.vision","stat\n',
      );
      return { route };
    });

    when('[t0] the raw entries are read', () => {
      then('it fails loud with the torn line + a fix hint', async () => {
        const error = await getError(
          getAllPassageReportsRaw({ route: scene.route }),
        );
        expect(error).toBeInstanceOf(UnexpectedCodePathError);
        expect(error.message).toContain('torn/unparseable line');
        expect(error.message).toContain('.route/passage.jsonl');
        // it names the torn line and a concrete repair hint, not a bare SyntaxError
        expect(error.message).toContain('stat');
        expect(error.message).toContain('repaired or removed');
      });
    });
  });

  given(
    '[case4] a NON-ENOENT read fault (passage.jsonl is a directory → EISDIR)',
    () => {
      // the read allowlists ONLY ENOENT (no file yet → no passage). every OTHER fault must SURFACE,
      // never collapse to `[]` — a blanket catch would degrade a real EACCES/EPERM/EISDIR into
      // "route not live" and the daemon would self-exit with no trace (rule.forbid.failhide). EISDIR
      // is the hermetic proxy for a non-ENOENT fault (chmod-based EACCES is flaky under a root CI).
      // clamps rule.require.clamp-edge-cases: RED under a blanket read-catch (would return []), GREEN
      // under the ENOENT-only allowlist (rethrows).
      const scene = useBeforeAll(async () => {
        const route = await fs.mkdtemp(
          path.join(os.tmpdir(), 'all-raw-eisdir-'),
        );
        // make passage.jsonl a DIRECTORY, so the read faults with EISDIR (not ENOENT)
        await fs.mkdir(path.join(route, '.route', 'passage.jsonl'), {
          recursive: true,
        });
        return { route };
      });

      when('[t0] the raw entries are read', () => {
        then('it surfaces the fault (never swallowed to [])', async () => {
          const error = await getError(
            getAllPassageReportsRaw({ route: scene.route }),
          );
          // getError only returns once the promise REJECTED — a return of [] would make getError
          // itself throw. so a returned error proves the fault surfaced, and its errno is NOT the one
          // allowlisted absence (ENOENT) — it is a real read fault (EISDIR here).
          expect(error).toBeTruthy();
          expect(asNodeErrnoCode(error)).not.toEqual('ENOENT');
        });
      });
    },
  );

  given('[case5] a torn line with BLANK lines interleaved above it', () => {
    // the torn line sits at PHYSICAL line 4 (a good line, two blanks, then the torn line). the
    // failloud error must report line 4 — the real file line a human edits — not the post-filter
    // index 2 that a `.filter(Boolean)` before the `.map((line,index))` would yield. clamps
    // rule.require.clamp-edge-cases: RED under the pre-filter index (reports 2), GREEN under the
    // physical-line-number tag applied before the blank-line filter (reports 4).
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'all-raw-blank-'));
      const passagePath = path.join(route, '.route', 'passage.jsonl');
      await fs.mkdir(path.dirname(passagePath), { recursive: true });
      // line1 = good, line2 = blank, line3 = blank, line4 = torn json
      await fs.writeFile(
        passagePath,
        '{"stone":"1.vision","status":"passed"}\n\n\n{"stone":"1.vision","stat\n',
      );
      return { route };
    });

    when('[t0] the raw entries are read', () => {
      then(
        'the failloud error names the PHYSICAL line (4), not the filtered index (2)',
        async () => {
          const error = await getError(
            getAllPassageReportsRaw({ route: scene.route }),
          );
          expect(error).toBeInstanceOf(UnexpectedCodePathError);
          expect(error.message).toContain('torn/unparseable line');
          expect(error.message).toMatch(/"lineNumber":\s*4/);
          expect(error.message).not.toMatch(/"lineNumber":\s*2/);
        },
      );
    });
  });
});
