import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = the cross-layer dirs import no layer above them
 * .why = `utils/` and `infra/` serve every layer and depend on none
 *        (rule.require.directional-deps). one upward import lets the next
 *        domain operation that reaches it close a cycle, so the direction is
 *        clamped here rather than left to review
 */
const ROOT_OF_SRC = path.join(__dirname, '..');

/**
 * .what = an import specifier that reaches a layer above `utils/` or `infra/`
 * .why = covers the `@src/` alias and a relative climb alike
 */
const PATTERN_OF_UPWARD_IMPORT =
  /from '(?:@src\/|(?:\.\.\/)+)(?:domain\.operations|domain\.objects|contract|access)\//;

describe('layer direction', () => {
  given('[case1] the prod files of the cross-layer dirs', () => {
    when('[t0] each one is read for its imports', () => {
      const offenders = useThen('the read succeeds', async () => {
        const files = await enumFilesFromGlob({
          glob: '{utils,infra}/**/*.ts',
          cwd: ROOT_OF_SRC,
          ignore: ['**/*.test.ts', '**/node_modules/**'],
        });
        const reads = await Promise.all(
          files.map(async (file) => ({
            file: path.relative(ROOT_OF_SRC, file),
            text: await fs.readFile(file, 'utf8'),
          })),
        );
        return {
          count: files.length,
          upward: reads
            .filter((read) => PATTERN_OF_UPWARD_IMPORT.test(read.text))
            .map((read) => read.file),
        };
      });

      then(
        'the glob reached real files, so an empty verdict means aught',
        () => {
          expect(offenders.count).toBeGreaterThan(0);
        },
      );

      then('no file imports a layer above it', () => {
        expect(offenders.upward).toEqual([]);
      });
    });
  });

  given('[case2] the pattern itself', () => {
    when('[t0] it reads the specifiers it must catch and spare', () => {
      then(
        'it catches the alias and a relative climb, and spares a peer',
        () => {
          expect(
            PATTERN_OF_UPWARD_IMPORT.test(
              "import { x } from '@src/domain.operations/isErrorOfAbsence';",
            ),
          ).toBe(true);
          expect(
            PATTERN_OF_UPWARD_IMPORT.test(
              "import { x } from '../../domain.operations/review/x';",
            ),
          ).toBe(true);
          expect(
            PATTERN_OF_UPWARD_IMPORT.test(
              "import { x } from '@src/utils/fs/isErrorOfAbsence';",
            ),
          ).toBe(false);
        },
      );
    });
  });
});
