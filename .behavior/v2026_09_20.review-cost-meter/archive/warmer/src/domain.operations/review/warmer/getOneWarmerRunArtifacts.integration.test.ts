import * as fs from 'fs';
import { getError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { getOneWarmerRunArtifacts } from './getOneWarmerRunArtifacts';

const REVIEWER = 'repo-rules';
const HEAD_OF_TEST = '# rules\n\nbe kind.\n';
const PROMPT_OF_TEST = `${HEAD_OF_TEST}<target.file path="a.ts">const a = 1;</target.file>`;

/**
 * .what = writes a run's log dir with whichever prompt artifacts this case declares
 * .why = the filenames are LITERAL here, never read from `NAME_OF_RUN_ARTIFACT`.
 *        the writer side of the grammar is this fixture; the reader side is the map.
 *        a fixture that read the map too would rename along with it and stay green
 *        over a corpus nobody can read (`asRunArtifactPath`).
 */
const setOneRunLogDir = (input: {
  cwd: string;
  head: string | null;
  prompt: string | null;
}): string => {
  const logDir = path.join(input.cwd, '.log', 'bhrain', 'review', 'run-1');
  fs.mkdirSync(logDir, { recursive: true });
  if (input.head !== null)
    fs.writeFileSync(path.join(logDir, 'input.prompt.head.md'), input.head);
  if (input.prompt !== null)
    fs.writeFileSync(path.join(logDir, 'input.prompt.md'), input.prompt);
  return logDir;
};

describe('getOneWarmerRunArtifacts', () => {
  given('[case1] a run that left both prompt artifacts', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-artifacts-whole' });
      return {
        logDir: setOneRunLogDir({
          cwd,
          head: HEAD_OF_TEST,
          prompt: PROMPT_OF_TEST,
        }),
      };
    });

    when('[t0] the pair is read', () => {
      then('it is the bytes the run wrote, verbatim', () => {
        expect(
          getOneWarmerRunArtifacts({
            logDir: scene.logDir,
            reviewer: REVIEWER,
          }),
        ).toEqual({ head: HEAD_OF_TEST, prompt: PROMPT_OF_TEST });
      });
    });
  });

  given('[case2] a run dir with no head at all', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-artifacts-no-head' });
      return {
        logDir: setOneRunLogDir({ cwd, head: null, prompt: PROMPT_OF_TEST }),
      };
    });

    when('[t0] the pair is read', () => {
      // one read, shared. the error rides in a plain object, since the
      // `useThen` proxy does not carry an Error instance through itself
      const read = useThen('it throws', async () => ({
        error: getError(() =>
          getOneWarmerRunArtifacts({
            logDir: scene.logDir,
            reviewer: REVIEWER,
          }),
        ),
      }));

      then('🔴 it throws rather than answers a half pair', () => {
        expect(read.error.message).toContain(
          'could not read a prompt artifact',
        );
      });

      then('🔴 the fault names the ARTIFACT, the PATH, and the LANE', () => {
        const error = read.error;
        // a detached, terminal-less child has no other voice — a bare ENOENT
        // leaves a driver with a dead warmer and no way to tell which lane died
        const said = JSON.stringify(error);
        expect(said).toContain('head');
        expect(said).toContain('input.prompt.head.md');
        expect(said).toContain(REVIEWER);
      });
    });
  });

  given('[case3] a run whose head shipped and whose prompt did not', () => {
    // the case `genReviewWarmer`'s spawn probe CANNOT catch: it proves the head
    // is present and says naught about the prompt, so a torn log dir reaches
    // this read. without a named fault here, that lane dies mute
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-artifacts-no-prompt' });
      return {
        logDir: setOneRunLogDir({ cwd, head: HEAD_OF_TEST, prompt: null }),
      };
    });

    when('[t0] the pair is read', () => {
      then('🔴 it throws, and names the PROMPT as the absent one', () => {
        const error = getError(() =>
          getOneWarmerRunArtifacts({
            logDir: scene.logDir,
            reviewer: REVIEWER,
          }),
        );
        expect(error.message).toContain('could not read a prompt artifact');

        const said = JSON.stringify(error);
        expect(said).toContain('input.prompt.md');
        expect(said).toContain(REVIEWER);
      });
    });
  });

  given('[case4] a log dir path node refuses as an argument', () => {
    when('[t0] the pair is read', () => {
      then(
        '🔴 the argument fault surfaces as itself, never dressed as an absent artifact',
        () => {
          // a null byte makes node throw `ERR_INVALID_ARG_VALUE` before any read;
          // that is a code defect, so it must not take the artifact wrap
          const error = getError(() =>
            getOneWarmerRunArtifacts({
              logDir: 'run\u0000dir',
              reviewer: REVIEWER,
            }),
          );
          expect(Reflect.get(error, 'code')).toEqual('ERR_INVALID_ARG_VALUE');
          expect(error.message).not.toContain(
            'could not read a prompt artifact',
          );
        },
      );
    });
  });
});
