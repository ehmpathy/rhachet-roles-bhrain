import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getRepoRootWithFallback } from '../guard/getRepoRootWithFallback';
import { BRAIN_DISPATCH_CLAIM_WINDOW_MS } from './BrainDispatchClaim';

/**
 * .what = the source of truth this window is sized against, read where rhachet ships it
 * .why = a `require` of this path would bind the BUILD to a `dist/` file on no published
 *        export path — the exact bond `BrainDispatchClaim`'s header refuses. a test-time
 *        READ is narrower: it binds only the SUITE, so a rhachet that moves the file goes
 *        red here (a loud, local, one-line repair) and ships no runtime break
 */
const CLONE_CONSTANTS_PATH = path.join(
  'node_modules',
  'rhachet',
  'dist',
  'domain.operations',
  'clone',
  'constants.js',
);

describe('BrainDispatchClaim.integration', () => {
  given(
    '[case1] the claim window, against the rhachet const it is copied from',
    () => {
      /**
       * 🔴 .why = `BRAIN_DISPATCH_CLAIM_WINDOW_MS` is a COPY of rhachet's
       *          `CLONE_SUBMIT_VERIFY_TIMEOUT_MS`. if rhachet's lifetime grows past it, the
       *          claim expires mid-write and the pty race returns with a green suite
       *
       * .note = reads the shipped const OFF DISK, so this is an integration test
       *         (`rule.forbid.unit.remote-boundaries`)
       * .note = asserts `>=`, never `===`: a LARGER window is safe, so a rhachet that shrank
       *         its timeout must not red the suite
       * ✅ .teeth = drop the window 15_000 → 10_000 and `[t0]`'s second row goes red
       */
      when('[t0] the rhachet const is read from node_modules', () => {
        const shipped = useBeforeAll(async () => {
          const repoRoot = await getRepoRootWithFallback({ from: __dirname });
          const file = path.join(repoRoot, CLONE_CONSTANTS_PATH);
          // .why guarded, verdict deferred = an absent file is the drift this case catches;
          //    a bare ENOENT in `useBeforeAll` would kill the case before the row that names
          //    the repair (`rule.require.failloud`)
          // .note = not a failhide: the absence is CARRIED, and the row below throws a named
          //         error with the fix
          const source = await fs
            .readFile(file, 'utf-8')
            .catch(() => null as string | null);
          const declared = source
            ? /CLONE_SUBMIT_VERIFY_TIMEOUT_MS\s*=\s*(\d+)/.exec(source)
            : null;
          return { file, source, declared };
        });

        then('the const is still declared at the path this copy cites', () => {
          // 🔴 .why = a regex that found naught would leave every check below to compare
          //          against `NaN` or to skip — a green clamp over a const it never located
          //          (`rule.forbid.failhide`). so the LOCATE is asserted before the VALUE
          // .why `BadRequestError` and not `ConstraintError` = this repo's
          //      `helpful-errors` exports `HelpfulError`, `UnexpectedCodePathError`, and
          //      `BadRequestError` and no `ConstraintError` at all. `BadRequestError`
          //      carries the same caller-must-fix sense the failfast brief assigns the
          //      latter, plus the metadata bag `rule.require.failloud` asks for
          if (shipped.source === null)
            throw new BadRequestError(
              'the rhachet clone constants file is absent at the path this suite cites',
              {
                expected: shipped.file,
                hint: 'run `npm ci`. if rhachet MOVED the file, re-derive CLONE_CONSTANTS_PATH in this suite — and keep BRAIN_DISPATCH_CLAIM_WINDOW_MS >= CLONE_SUBMIT_VERIFY_TIMEOUT_MS, which is the bond this case exists to hold',
              },
            );
          expect(shipped.declared).not.toEqual(null);
        });

        then('the claim window is at least as long as it', () => {
          // the claim must still stand while the child it guards may still be mid-write.
          // shorter, and two children overlap — which is the hazard, never a smaller one
          const timeout = Number(shipped.declared?.[1]);
          expect(Number.isFinite(timeout)).toEqual(true);
          expect(BRAIN_DISPATCH_CLAIM_WINDOW_MS).toBeGreaterThanOrEqual(
            timeout,
          );
        });
      });
    },
  );
});
