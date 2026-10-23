import * as fs from 'fs';
import { asIsoPriceHuman } from 'iso-price';
import * as path from 'path';
import type { BrainChoice, BrainOutputMetrics, ContextBrain } from 'rhachet';
import { genBrainAtom } from 'rhachet-brains-openrouter';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { DEFAULT_TEST_BRAIN } from '@src/.test/genTestBrainContext';
import { NAME_OF_RUN_ARTIFACT } from '@src/domain.operations/review/asRunArtifactPath';

import { setOneReviewLanePrime } from './setOneReviewLanePrime';

/**
 * .what = the metrics the fake brain reports for the poke
 */
const METRICS = {
  size: {
    tokens: { input: 100, output: 1, cache: { get: 0, set: 0 } },
    chars: { input: 400, output: 4, cache: { get: 0, set: 0 } },
  },
  cost: {
    time: { seconds: 1 },
    cash: {
      total: 'USD 0.01',
      deets: {
        input: 'USD 0.01',
        output: 'USD 0.00',
        cache: { get: 'USD 0.00', set: 'USD 0.00' },
      },
    },
  },
} as BrainOutputMetrics; // a plain literal of the declared shape; the class adds no field

/**
 * .what = a brain context whose ask acks the poke, with no network call
 *
 * .mock = the brain's `ask`, alone
 * .why = this suite asserts what the lane prime RECORDS in its run dir, a decision made
 *        after the brain answers; a live provider would add cost and variance and settle
 *        naught here. the spec is the real test brain's
 * .real = the live poke contract is exercised by `setOnePrefixPoke.integration.test.ts` `[case4]`
 */
const genBrainThatAcks = (): ContextBrain<BrainChoice> => {
  const atom = genBrainAtom({ slug: DEFAULT_TEST_BRAIN });
  const choice = {
    slug: atom.slug,
    spec: atom.spec,
    ask: async () => ({ output: { ack: true }, metrics: METRICS }),
  };
  return { brain: { choice } } as unknown as ContextBrain<BrainChoice>; // a fake reads only slug, spec, and ask
};

describe('setOneReviewLanePrime', () => {
  given('[case1] a lane head sent as a poke', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'review-lane-prime', git: true });
      const result = await setOneReviewLanePrime(
        {
          head: '# rules\n\nname the actor, then the act.\n',
          cwd,
          output: path.join(cwd, 'review.md'),
          metricsExpected: {
            files: {
              rulesCount: 1,
              refsCount: 0,
              conversationCount: 0,
              targetsCount: 0,
            },
            tokens: { estimate: 100, contextWindowPercent: 1 },
            cost: { estimate: asIsoPriceHuman('USD 0.01') },
          },
        },
        { brain: genBrainThatAcks() },
      );
      const realized = JSON.parse(
        fs.readFileSync(
          path.join(result.log.dir, NAME_OF_RUN_ARTIFACT.realized),
          'utf-8',
        ),
      ) as { compiled: string | null };
      return { result, realized };
    });

    when('[t0] the prime records its run', () => {
      then('its spend is recorded in a run dir of its own', () => {
        expect(scene.result.outcome).toEqual('primed');
        expect(scene.result.metrics.realized.cost?.total).toEqual(
          asIsoPriceHuman('USD 0.01'),
        );
      });

      then(
        '🔴 it points at no compiled artifact — a lane prime compiles no prompt, so a pointer would name an absent file',
        () => {
          expect(scene.realized.compiled).toEqual(null);
          expect(
            fs.existsSync(
              path.join(scene.result.log.dir, NAME_OF_RUN_ARTIFACT.compiled),
            ),
          ).toEqual(false);
        },
      );
    });
  });

  given(
    '[case2] a lane head whose poke faults once with a 502, then answers',
    () => {
      /**
       * .why = a 502 may close after the provider billed the whole prefix. the answered
       *        ask reports only itself, so a cost stated from it reads below the bill —
       *        the prime must grade its run `unknown`, as the review ask does
       */
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'review-lane-prime-502', git: true });
        const asks: number[] = [];
        const brainOfAcks = genBrainThatAcks();
        const brain = {
          brain: {
            choice: {
              ...brainOfAcks.brain.choice,
              ask: async () => {
                asks.push(asks.length + 1);
                if (asks.length === 1)
                  throw Object.assign(new Error('502 bad gateway'), {
                    status: 502,
                  });
                return { output: { ack: true }, metrics: METRICS };
              },
            },
          },
        } as unknown as ContextBrain<BrainChoice>; // a fake reads only slug, spec, and ask
        const result = await setOneReviewLanePrime(
          {
            head: '# rules\n\nname the actor, then the act.\n',
            cwd,
            output: path.join(cwd, 'review.md'),
            metricsExpected: {
              files: {
                rulesCount: 1,
                refsCount: 0,
                conversationCount: 0,
                targetsCount: 0,
              },
              tokens: { estimate: 100, contextWindowPercent: 1 },
              cost: { estimate: asIsoPriceHuman('USD 0.01') },
            },
          },
          { brain },
        );
        return { asks, result };
      });

      when('[t0] the prime records its run', () => {
        then('the poke asked twice', () => {
          expect(scene.asks.length).toEqual(2);
        });

        then(
          '🔴 it writes no realized artifact, so the meter grades the prime unknown — never a low cost',
          () => {
            expect(
              fs.existsSync(
                path.join(scene.result.log.dir, NAME_OF_RUN_ARTIFACT.realized),
              ),
            ).toEqual(false);
          },
        );

        then('and its return states no cost', () => {
          expect(scene.result.outcome).toEqual('primed');
          expect(scene.result.metrics.realized.cost).toEqual(null);
        });
      });
    },
  );
});
