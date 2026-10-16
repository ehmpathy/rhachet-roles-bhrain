import * as fs from 'node:fs';
import * as path from 'node:path';
import { given, then, when } from 'test-fns';

import { DEFAULT_TEST_BRAIN } from './genTestBrainContext';

/**
 * .what = clamp: the blackbox suites follow DEFAULT_TEST_BRAIN, and every temp repo they
 *         build can register it
 * .why = a default cutover stranded the blackbox suites twice over, and each half failed
 *        in its own way:
 *        - suites that passed a literal provider slug kept their old provider, so one
 *          account outage (`412 … suspended`) failed them all while the default had moved
 *        - suites that read the default ran in a fixture whose package.json, or whose
 *          node_modules symlink set, lacked the new provider package — so every review
 *          refused with `brain '…' is not registered` before a brain was reached
 *        both read green on every type check. this clamp reads the files that carry them
 *
 * .note = a filesystem read, so it is an integration test (rule.forbid.unit.remote-boundaries)
 */
const ROOT_OF_REPO = path.join(__dirname, '../..');
const DIR_OF_BLACKBOX = path.join(ROOT_OF_REPO, 'blackbox');

/** .what = the brains package that registers a provider, keyed by the slug's provider */
const PACKAGE_BY_PROVIDER: Record<string, string> = {
  anthropic: 'rhachet-brains-anthropic',
  openai: 'rhachet-brains-openai',
  openrouter: 'rhachet-brains-openrouter',
};

/**
 * .what = slugs a suite feeds to a brain refusal on purpose, exempt from the pin check
 * .why = a refusal is raised before any brain is reached, so a provider outage cannot fail
 *        it, and the suite's own refusal assertion catches a fixture that lacks the package.
 *        each entry names the one slug, never a provider, so any other pin still fails
 * .note = empty today: every refusal fixture names a provider no package registers
 */
const SLUGS_OF_REFUSAL_FIXTURE: string[] = [];

/** .what = every file under a dir, recursively, with node_modules left out */
const getAllFilesUnder = (input: { dir: string }): string[] =>
  fs
    .readdirSync(input.dir, { withFileTypes: true })
    .filter((entry) => entry.name !== 'node_modules')
    .flatMap((entry) => {
      const at = path.join(input.dir, entry.name);
      if (entry.isDirectory()) return getAllFilesUnder({ dir: at });
      return [at];
    });

describe('blackboxBrainLinks.integration', () => {
  const providerOfDefault = DEFAULT_TEST_BRAIN.split('/')[0] ?? '';
  const packageOfDefault = PACKAGE_BY_PROVIDER[providerOfDefault];

  given('[case1] the default test brain', () => {
    when('[t0] the default is resolved to a package', () => {
      then('its provider maps to a known brains package', () => {
        expect(packageOfDefault).toBeDefined();
      });
    });
  });

  given('[case2] the blackbox suites and their invoke scripts', () => {
    const files = getAllFilesUnder({ dir: DIR_OF_BLACKBOX }).filter((file) =>
      file.endsWith('.ts'),
    );
    const sources = files.map((file) => ({
      file,
      text: fs.readFileSync(file, 'utf8'),
    }));

    when('[t0] each is read for a literal provider slug', () => {
      then('none pins a provider — each follows DEFAULT_TEST_BRAIN', () => {
        const pattern = new RegExp(
          `['"\`](${Object.keys(PACKAGE_BY_PROVIDER).join('|')})/[a-z]`,
        );
        const pinned = sources
          .filter((one) =>
            pattern.test(
              SLUGS_OF_REFUSAL_FIXTURE.reduce(
                (text, slug) => text.split(slug).join(''),
                one.text,
              ),
            ),
          )
          .map((one) => one.file);
        expect(pinned).toEqual([]);
      });
    });

    when('[t1] each file that symlinks brain packages is read', () => {
      then('every such file symlinks the default provider package', () => {
        const linkers = sources.filter((one) =>
          one.text.includes("'node_modules/rhachet-brains-"),
        );
        expect(linkers.length).toBeGreaterThan(0);
        const unwired = linkers
          .filter(
            (one) => !one.text.includes(`'node_modules/${packageOfDefault}'`),
          )
          .map((one) => one.file);
        expect(unwired).toEqual([]);
      });
    });
  });

  given('[case3] the fixtures that declare brain packages', () => {
    const manifests = getAllFilesUnder({
      dir: path.join(DIR_OF_BLACKBOX, '.test/assets'),
    }).filter((file) => path.basename(file) === 'package.json');
    const brainAware = manifests
      .map((file) => ({ file, text: fs.readFileSync(file, 'utf8') }))
      .filter((one) => one.text.includes('"rhachet-brains-'));

    when('[t0] each is read', () => {
      then('every one declares the default provider package', () => {
        expect(brainAware.length).toBeGreaterThan(0);
        const unwired = brainAware
          .filter((one) => !one.text.includes(`"${packageOfDefault}"`))
          .map((one) => one.file);
        expect(unwired).toEqual([]);
      });
    });
  });
});
