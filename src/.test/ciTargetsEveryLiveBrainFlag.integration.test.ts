import { readFile } from 'fs/promises';
import { join } from 'path';

import { given, then, useBeforeAll, when } from 'test-fns';

import { enumFilesFromGlob } from '@src/domain.operations/review/enumFilesFromGlob';

// .note = js-yaml ships no types; required as the rest of src does (asReviewRubricsConfig.ts)
const yaml = require('js-yaml');

/**
 * .what = clamps that ci targets every live-brain flag a gated test reads
 * .why = each live-brain given runs only where a named `BHRAIN_TEST_LIVE_<X>=1` flag targets
 *   it, so a keyless host runs green. ci holds the keys (keyrack firewall), so ci must set every
 *   such flag, or the real-provider contract is proven only by skips. a new flag that ci does
 *   not set turns this red
 */

// flags a test reads that ci leaves off on purpose: premium or measurement extras, never the
// only real-provider coverage of a contract
const FLAGS_OPT_IN_ONLY: Record<string, string> = {
  BHRAIN_TEST_LIVE_BRAIN_SONNET: 'a second, pricier suite pinned to one premium model',
  BHRAIN_TEST_LIVE_BRAIN_CACHE: 'a prompt-cache measurement, run by hand',
};

// the ci jobs that run the gated suites, beside the keyrack firewall step that supplies keys
const CI_JOBS_WITH_KEYS = ['test-shards-integration', 'test-shards-acceptance'];

describe('ciTargetsEveryLiveBrainFlag', () => {
  const scene = useBeforeAll(async () => {
    // every flag a test reads
    const testFiles = await enumFilesFromGlob({
      glob: '{src,blackbox}/**/*.test.ts',
      gitignore: true,
    });
    const contents = await Promise.all(
      testFiles.map((file) => readFile(join(process.cwd(), file), 'utf8')),
    );
    const flagsRead = [
      ...new Set(
        contents.flatMap(
          (content) => content.match(/BHRAIN_TEST_LIVE_[A-Z_]*[A-Z]/g) ?? [],
        ),
      ),
    ].sort();

    // the job env ci sets, per job
    const workflow = yaml.load(
      await readFile(join(process.cwd(), '.github/workflows/.test.yml'), 'utf8'),
    );
    const envByJob = Object.fromEntries(
      CI_JOBS_WITH_KEYS.map((job) => [job, workflow.jobs[job]?.env ?? {}]),
    ) as Record<string, Record<string, string>>;

    // the step runs per job, so the keys each flag needs are present
    const stepRunsByJob = Object.fromEntries(
      CI_JOBS_WITH_KEYS.map((job) => [
        job,
        (workflow.jobs[job]?.steps ?? []).map(
          (step: { run?: string }) => step.run ?? '',
        ),
      ]),
    ) as Record<string, string[]>;

    return { flagsRead, envByJob, stepRunsByJob };
  });

  given('[case1] the gated test suites and the ci workflow', () => {
    when('[t0] the flags read are compared with the job env ci sets', () => {
      then('the gated suites read live-brain flags', () => {
        expect(scene.flagsRead).toContain('BHRAIN_TEST_LIVE_BRAIN_REVIEW');
      });

      then('each ci job with keys sets every flag that is not opt-in only', () => {
        const flagsOwed = scene.flagsRead.filter(
          (flag) => !(flag in FLAGS_OPT_IN_ONLY),
        );
        for (const job of CI_JOBS_WITH_KEYS) {
          const flagsSet = Object.keys(scene.envByJob[job]!).filter(
            (flag) => String(scene.envByJob[job]![flag]) === '1',
          );
          expect({ job, flagsAbsent: flagsOwed.filter((flag) => !flagsSet.includes(flag)) }).toEqual({
            job,
            flagsAbsent: [],
          });
        }
      });

      then('each ci job with flags runs the keyrack firewall, which supplies the keys', () => {
        for (const job of CI_JOBS_WITH_KEYS) {
          const hasFirewall = scene.stepRunsByJob[job]!.some((run) =>
            run.includes('rhachet keyrack firewall --env test'),
          );
          expect({ job, hasFirewall }).toEqual({ job, hasFirewall: true });
        }
      });

      then('no ci job sets an opt-in only flag', () => {
        for (const job of CI_JOBS_WITH_KEYS) {
          const flagsOptInSet = Object.keys(FLAGS_OPT_IN_ONLY).filter(
            (flag) => flag in scene.envByJob[job]!,
          );
          expect({ job, flagsOptInSet }).toEqual({ job, flagsOptInSet: [] });
        }
      });
    });
  });
});
