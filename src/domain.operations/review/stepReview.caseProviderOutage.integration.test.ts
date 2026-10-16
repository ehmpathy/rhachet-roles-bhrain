import * as fs from 'fs';
import { getError, UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import {
  DEFAULT_TEST_BRAIN,
  genTestBrainContext,
} from '@src/.test/genTestBrainContext';
import { NAME_OF_RUN_ARTIFACT } from '@src/domain.operations/review/asRunArtifactPath';

import { ReviewBrainCallError } from './ReviewBrainCallError';
import { stepReview } from './stepReview';

/**
 * .what = writes a file, parents and all
 */
const setOneFile = (input: { at: string; text: string }): void => {
  fs.mkdirSync(path.dirname(input.at), { recursive: true });
  fs.writeFileSync(input.at, input.text, 'utf-8');
};

/**
 * .what = the filenames the run landed in its log dir, sorted
 */
const getAllArtifactsWritten = (input: { cwd: string }): string[] => {
  const root = path.join(input.cwd, '.log/bhrain/review');
  const runs = fs.readdirSync(root).sort();
  const latest = runs[runs.length - 1];
  if (!latest)
    throw new UnexpectedCodePathError('no review log dir under the fixture', {
      root,
      hint: 'the review never minted a log dir; check the stepReview call ran under this cwd',
    });
  return fs.readdirSync(path.join(root, latest)).sort();
};

/**
 * .what = the clamp on "unknown, never $0.00" at the orchestrator grain
 * .why = 🔴 a run's cost is `unknown` exactly when `metrics.realized.json` is absent,
 *        and it is absent because `stepReview` writes it from the provider's ANSWER.
 *        a refactor that pre-writes a zeroed record "for observability" would mint a
 *        `metered $0.00` run out of an outage, and every unit test of the meter would
 *        stay green — they read fixtures, never the orchestrator. this case drives the
 *        real orchestrator into a provider fault and reads what landed on disk.
 *
 * .mock = the provider's `ask`, and no other layer.
 * .why = a provider outage cannot be produced on demand: a real refusal needs a spend
 *        cap, a revoked key, or a down replica, none of which a hermetic suite can
 *        summon (rule.forbid.integration.mocks, its documented-exception clause).
 *        every other layer — scope, render, artifact writes — runs real.
 * .real = `stepReview.integration.test.ts` drives the same orchestrator against the
 *         live provider and asserts the realized record on the success path.
 */
describe('stepReview — a provider outage', () => {
  given('[case1] a review whose provider ask rejects', () => {
    const run = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'review-provider-outage', git: true });
      setOneFile({
        at: path.join(cwd, 'rules/rule.name-the-actor.md'),
        text: '# rule.name-the-actor\n\nname the actor, then the act.\n',
      });
      setOneFile({
        at: path.join(cwd, 'src/paddleOut.ts'),
        text: 'export const paddleOut = () => "the wave was caught";\n',
      });

      const brain = await genTestBrainContext({ brain: DEFAULT_TEST_BRAIN });
      jest
        .spyOn(brain.brain.choice, 'ask')
        .mockRejectedValue(new Error('503 upstream unavailable'));

      const error = await getError(
        stepReview(
          {
            rules: 'rules/**/*.md',
            paths: 'src/**/*.ts',
            output: path.join(cwd, 'review.md'),
            focus: 'push',
            goal: 'representative',
            cwd,
          },
          { brain },
        ),
      );
      return { error, artifacts: getAllArtifactsWritten({ cwd }) };
    });

    when('[t0] the run fails', () => {
      then('the provider fault surfaces as itself', () => {
        expect(run.error.message).toContain('503 upstream unavailable');
      });

      then('🔴 and wears the malfunction header, as the timeout does', () => {
        expect(run.error.message).toContain('💥 MalfunctionError:');
        expect(run.error).toBeInstanceOf(ReviewBrainCallError);
      });

      then(
        '🔴 no realized record landed — so the meter grades it unknown',
        () => {
          expect(run.artifacts).not.toContain(NAME_OF_RUN_ARTIFACT.realized);
        },
      );

      then('🟡 while the prompt DID land, so the clamp is not vacuous', () => {
        expect(run.artifacts).toContain(NAME_OF_RUN_ARTIFACT.prompt);
      });
    });
  });
});
