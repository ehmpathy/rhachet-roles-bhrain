import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = no prod order in `src/` reads the host locale
 * .why = `localeCompare` collates by the runtime's default locale, which is host
 *        state. an order that decides logic — which run is first in a lane, which
 *        stone is next, which file leads a prompt — must read one way on every
 *        machine, so every comparator goes through `compareStrings`, and this scan
 *        holds that line rather than leave it to review
 */
const ROOT_OF_SRC = path.join(__dirname, '..');

/**
 * .what = a call of `localeCompare` — never a mention of it in prose
 * .why = the comments that name the hazard must not trip the scan that guards it
 */
const PATTERN_OF_LOCALE_ORDER = /\.localeCompare\(/;

/**
 * .what = a number render with no locale named — `toLocaleString()` bare
 * .why = the same host state, on the render side: a count grouped by the host locale
 *        reads `1.234` on one machine and `1,234` on the next, so a count names its
 *        locale (`asCountHuman`, or `toLocaleString('en-US')` outside review)
 */
const PATTERN_OF_LOCALE_RENDER = /\.toLocaleString\(\)/;

describe('compareStrings — locale-free order', () => {
  given('[case1] the prod files of src/', () => {
    when('[t0] each one is read for a locale-bound comparator', () => {
      const scan = useThen('the read succeeds', async () => {
        const files = await enumFilesFromGlob({
          glob: '**/*.ts',
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
          offenders: reads
            .filter((read) => PATTERN_OF_LOCALE_ORDER.test(read.text))
            .map((read) => read.file),
          offendersOfRender: reads
            .filter((read) => PATTERN_OF_LOCALE_RENDER.test(read.text))
            .map((read) => read.file),
        };
      });

      then('🔴 no prod file renders a number by the host locale', () => {
        expect(scan.offendersOfRender).toEqual([]);
      });

      then(
        'the glob reached real files, so an empty verdict means aught',
        () => {
          expect(scan.count).toBeGreaterThan(100);
        },
      );

      then('🔴 no prod file orders by the host locale', () => {
        expect(scan.offenders).toEqual([]);
      });
    });
  });

  given('[case2] the pattern itself', () => {
    when('[t0] it reads the lines it must catch and spare', () => {
      then('it catches a call and spares a mention in prose', () => {
        expect(
          PATTERN_OF_LOCALE_ORDER.test('a.name.localeCompare(b.name)'),
        ).toBe(true);
        expect(
          PATTERN_OF_LOCALE_ORDER.test(
            ' * .note = via compareStrings, never localeCompare: host state',
          ),
        ).toBe(false);
      });

      then('it catches a bare render and spares a pinned one', () => {
        expect(PATTERN_OF_LOCALE_RENDER.test('n.toLocaleString()')).toBe(true);
        expect(PATTERN_OF_LOCALE_RENDER.test("n.toLocaleString('en-US')")).toBe(
          false,
        );
      });
    });
  });
});
