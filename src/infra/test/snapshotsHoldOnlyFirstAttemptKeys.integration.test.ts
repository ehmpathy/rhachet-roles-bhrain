import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

/**
 * .what = clamps that no committed snapshot holds a key from a later repeatably attempt
 * .why = a suite with `criteria: process.env.CI ? 'SOME' : 'EVERY'` runs every attempt
 *        locally, so a local resnap writes `attempt 2` and `attempt 3` keys. CI runs SOME,
 *        which skips each attempt after a pass, so those keys go unchecked, jest reads
 *        them as obsolete, and the acceptance shard fails with every test green
 * .note = the cure for a red here: delete the `, attempt N then:` blocks where N > 1;
 *         the `attempt 1` key is the one both runners write
 */

const REPO_ROOT = path.join(__dirname, '../../..');
const SNAPSHOT_DIRS = ['blackbox/__snapshots__'];
const KEY_OF_LATER_ATTEMPT = /^exports\[`.*, attempt ([2-9]|\d{2,}) then: /;

describe('snapshotsHoldOnlyFirstAttemptKeys', () => {
  given('[case1] the committed acceptance snapshots', () => {
    when('[t0] each snapshot file is scanned for later-attempt keys', () => {
      const scan = useThen('the scan completes', async () => {
        // list every snapshot file under the scanned dirs
        const files = (
          await Promise.all(
            SNAPSHOT_DIRS.map(async (dir) =>
              (
                await fs.readdir(path.join(REPO_ROOT, dir))
              )
                .filter((name) => name.endsWith('.snap'))
                .map((name) => `${dir}/${name}`),
            ),
          )
        ).flat();

        // collect each line that carries a later-attempt key, as file:line
        const offenders = (
          await Promise.all(
            files.map(async (file) =>
              (
                await fs.readFile(path.join(REPO_ROOT, file), 'utf8')
              )
                .split('\n')
                .map((line, index) =>
                  KEY_OF_LATER_ATTEMPT.test(line)
                    ? `${file}:${index + 1}`
                    : null,
                )
                .filter((found): found is string => found !== null),
            ),
          )
        ).flat();

        return { offenders, filesScanned: files.length };
      });

      then('at least one snapshot file was scanned', () => {
        expect(scan.filesScanned).toBeGreaterThan(0);
      });

      then('no snapshot holds a key from attempt 2 or later', () => {
        expect(scan.offenders).toEqual([]);
      });
    });
  });
});
