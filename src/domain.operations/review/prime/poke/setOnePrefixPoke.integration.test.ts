import * as fs from 'fs';
import { getError } from 'helpful-errors';
import * as path from 'path';
import type { BrainChoice, ContextBrain } from 'rhachet';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';
import { getUuid } from 'uuid-fns';

import {
  DEFAULT_TEST_BRAIN,
  genTestBrainContext,
} from '@src/.test/genTestBrainContext';
import { REPEATABLY_CONFIG } from '@src/.test/infra/repeatably';
import { ReviewBrainCallError } from '@src/domain.operations/review/ReviewBrainCallError';
import { ReviewTimeoutError } from '@src/domain.operations/review/ReviewTimeoutError';

import {
  asPrefixPokeHeadPath,
  DIR_OF_PREFIX_POKES,
} from './asPrefixPokeHeadPath';
import { isErrorOfPokeFault } from './isErrorOfPokeFault';
import { setOnePrefixPoke } from './setOnePrefixPoke';

const HEAD_OF_TEST = '# rules\n\nbe kind.\n';
const TAIL_OF_TEST = '<target.file path="a.ts">const a = 1;</target.file>';

/**
 * .what = a brain that records what it was asked and answers a declared measurement
 *
 * .mock = the brain's `choice.ask` — the live provider call
 * .why = a poke costs real money against a live provider, so a suite that called
 *        one would be a cost center and a flake source. what this operation owes
 *        is the SHAPE of the call — the head in the system slot, the ask at the
 *        tail's end — and a stub reads that more sharply than a live call could.
 *        the provider's answer to that shape is not this suite's claim to make.
 * .real = `[case4]` below sends one real poke and reads back every field a poke row
 *         needs. and the provider contract for the SAME role shape is exercised live:
 *         `stepReview.casePromptCache.integration.test.ts` sends a real review
 *         through `asRoleOfSharedPrefix` against the real brain and reads its
 *         cache metrics back, and `asRoleOfSharedPrefix.integration.test.ts`
 *         clamps, with no mock, that the poke and the review hand the provider
 *         byte-identical system prompts. so the one fact a live poke would add —
 *         does the provider bill this shape as a cache read — is already proven
 *         on the review path.
 */
const genBrainStub = (input: {
  inputTokens: number;
  cacheGetTokens: number;
}): {
  brain: ContextBrain<BrainChoice>;
  calls: { briefUris: string[]; prompt: string }[];
} => {
  const calls: { briefUris: string[]; prompt: string }[] = [];
  const ask = async (askInput: {
    role: { briefs: { ref: { uri: string } }[] };
    prompt: string;
  }): Promise<unknown> => {
    calls.push({
      briefUris: askInput.role.briefs.map((brief) => brief.ref.uri),
      prompt: askInput.prompt,
    });
    return {
      output: { ack: 'ack' },
      metrics: {
        size: {
          tokens: {
            input: input.inputTokens,
            cache: { get: input.cacheGetTokens, set: 0 },
          },
        },
        cost: { cash: { total: 'USD 0.000429' } },
      },
    };
  };
  return {
    calls,
    brain: {
      brain: { choice: { ask } },
    } as unknown as ContextBrain<BrainChoice>,
  };
};

describe('setOnePrefixPoke', () => {
  given('[case1] a poke the provider served almost entirely from cache', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'poke-measured-hit' });
      const stub = genBrainStub({ inputTokens: 2, cacheGetTokens: 998 });
      const measured = await setOnePrefixPoke(
        {
          cwd,
          reviewer: 'repo-rules',
          head: HEAD_OF_TEST,
          tail: TAIL_OF_TEST,
          msOfTimeout: null,
        },
        { brain: stub.brain },
      );
      return { cwd, stub, measured };
    });

    when('[t0] the poke is sent', () => {
      then('🔴 the head reaches the SYSTEM slot, never the prompt', () => {
        // the affinity pin is derived from the system prompt, and a cache lives
        // per replica. a head carried in the user message pins naught, so the
        // poke would land at an arbitrary desk and warm a replica nobody reads
        expect(scene.stub.calls.length).toEqual(1);
        expect(scene.stub.calls[0]?.briefUris.length).toEqual(1);
        expect(scene.stub.calls[0]?.prompt).not.toContain(HEAD_OF_TEST);
      });

      then('🔴 the ask rides at the END, so the tail still prefixes', () => {
        // a line at the HEAD of the tail would part the poke from the real review
        // at byte 0 of the user message — and warm a prefix the review never sends
        const prompt = scene.stub.calls[0]?.prompt ?? '';
        expect(prompt.startsWith(TAIL_OF_TEST)).toEqual(true);
        expect(prompt).toContain('this is a cache poke, not a review');
      });

      then('the head is written under the poke cache dir', () => {
        // never into the review run's own log dir — that dir is the run's record
        const at = asPrefixPokeHeadPath({
          cwd: scene.cwd,
          reviewer: 'repo-rules',
          head: HEAD_OF_TEST,
        });
        expect(
          at.startsWith(
            path.join(scene.cwd, DIR_OF_PREFIX_POKES, 'reviewer=repo-rules'),
          ),
        ).toEqual(true);
        expect(fs.readFileSync(at, 'utf8')).toEqual(HEAD_OF_TEST);
        expect(scene.stub.calls[0]?.briefUris[0]).toContain(path.basename(at));
      });

      then('🔴 promptTokens counts the CACHED tokens too', () => {
        // the hit grade is `cacheGet / promptTokens`. a denominator of `input`
        // alone reads 998/2 — so every poke grades as a hit, and the ~1-in-5 MISS
        // the census measured would never once be named (wish bar 10)
        expect(scene.measured.promptTokens).toEqual(1_000);
        expect(scene.measured.cacheGetTokens).toEqual(998);
      });

      then('the cost is rendered human, from what the provider billed', () => {
        expect(scene.measured.cost).toEqual('$0.000429');
      });
    });
  });

  given('[case2] a poke that met a cold replica', () => {
    /**
     * .why = the measured ~1-in-5 case. the affinity header is a HINT, so a
     *           poke can land at a desk that never held this prefix — and it bills
     *           in full for a warm nobody will read.
     */
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'poke-measured-miss' });
      const stub = genBrainStub({ inputTokens: 1_000, cacheGetTokens: 0 });
      const measured = await setOnePrefixPoke(
        {
          cwd,
          reviewer: 'repo-rules',
          head: HEAD_OF_TEST,
          tail: TAIL_OF_TEST,
          msOfTimeout: null,
        },
        { brain: stub.brain },
      );
      return { measured };
    });

    when('[t0] the poke is measured', () => {
      then('🔴 a zero serve is reported as zero, never as absent', () => {
        // `0` is a MEASURED fact here, and the hit grade must be able to read it.
        // an absent figure would be graded `unknown` and excluded from the rate
        expect(scene.measured.cacheGetTokens).toEqual(0);
        expect(scene.measured.promptTokens).toEqual(1_000);
      });

      then('and the spend is still recorded — a miss bills in full', () => {
        expect(scene.measured.cost).toEqual('$0.000429');
      });
    });
  });

  given('[case5] two primes of one reviewer poke two heads at once', () => {
    /**
     * .why = two lanes of one reviewer may prime two heads at once. a head file keyed by
     *        reviewer alone let one overwrite the other between its write and its ask, so
     *        a poke pinned a replica for a prefix it does not prime
     */
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'poke-two-heads' });
      const stub = genBrainStub({ inputTokens: 2, cacheGetTokens: 998 });
      const headPrior = `${HEAD_OF_TEST}prior\n`;
      const headNext = `${HEAD_OF_TEST}next\n`;
      await Promise.all(
        [headPrior, headNext].map((head) =>
          setOnePrefixPoke(
            {
              cwd,
              reviewer: 'repo-rules',
              head,
              tail: TAIL_OF_TEST,
              msOfTimeout: null,
            },
            { brain: stub.brain },
          ),
        ),
      );
      return { cwd, stub, headPrior, headNext };
    });

    when('[t0] both pokes are sent', () => {
      then('each head lands in its own file, with its own bytes', () => {
        const atPrior = asPrefixPokeHeadPath({
          cwd: scene.cwd,
          reviewer: 'repo-rules',
          head: scene.headPrior,
        });
        const atNext = asPrefixPokeHeadPath({
          cwd: scene.cwd,
          reviewer: 'repo-rules',
          head: scene.headNext,
        });
        expect(atPrior).not.toEqual(atNext);
        expect(fs.readFileSync(atPrior, 'utf8')).toEqual(scene.headPrior);
        expect(fs.readFileSync(atNext, 'utf8')).toEqual(scene.headNext);
      });

      then('each ask rides a distinct brief', () => {
        const uris = scene.stub.calls.map((call) => call.briefUris[0]);
        expect(new Set(uris).size).toEqual(2);
      });
    });
  });

  given('[case3] a provider that never answers', () => {
    /**
     * .why = the wedge bound is the one safety mechanism in this file that no
     *           other case fires. a regression in the race — a timer never armed, or
     *           a `clearTimeout` moved out of `finally` — would strand a prime on a
     *           promise that never settles, and hold its whole pour behind it. the
     *           bound is shortened here so the
     *           case fires it in milliseconds rather than two minutes
     */
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'poke-measured-wedge' });
      const brain = {
        brain: { choice: { ask: () => new Promise<never>(() => undefined) } },
      } as unknown as ContextBrain<BrainChoice>;
      const error = await getError(
        setOnePrefixPoke(
          {
            cwd,
            reviewer: 'repo-rules',
            head: HEAD_OF_TEST,
            tail: TAIL_OF_TEST,
            msOfTimeout: 50,
          },
          { brain },
        ),
      );
      return { error };
    });

    when('[t0] the bound elapses', () => {
      then(
        '🔴 the poke REJECTS as a brain call fault, never a nil measurement',
        () => {
          // a nil that flowed on would be recorded as a free poke of zero tokens.
          // and the class names the PROVIDER — never a class that names a defect in
          // our own code, which a defect list could later turn into a rethrow
          expect(scene.error).toBeInstanceOf(ReviewBrainCallError);
          expect(scene.error.name).toEqual('ReviewBrainCallError');
          expect(scene.error.message).toContain('the brain call failed');
        },
      );

      then('🔴 the prime classifies it as a fault', () => {
        expect(isErrorOfPokeFault({ error: scene.error })).toEqual(true);
      });

      then(
        'and the rejection carries the bound it waited, for the fault row',
        () => {
          expect(scene.error.message).toContain('timed out after 50ms');
          expect(Reflect.get(scene.error, 'cause')).toBeInstanceOf(
            ReviewTimeoutError,
          );
        },
      );
    });
  });

  given(
    '[case6] a provider that faults once, transiently, then answers',
    () => {
      /**
       * .why = one gateway 502 must not make a prime pour cold. the review ask retries a transient fault; the poke is the same act,
       *        so it retries the same way, inside its own wedge bound
       */
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'poke-transient-retry' });
        const stub = genBrainStub({ inputTokens: 2, cacheGetTokens: 998 });
        const asks: number[] = [];
        const brain = {
          brain: {
            choice: {
              ask: async (askInput: unknown) => {
                asks.push(asks.length + 1);
                if (asks.length === 1)
                  throw Object.assign(new Error('502 bad gateway'), {
                    status: 502,
                  });
                // .note = the stub's own `ask` takes the role shape the poke sends; the
                //         `as` only widens it to the seam this wrapper sits on
                const askOfStub = stub.brain.brain.choice.ask as unknown as (
                  input: unknown,
                ) => Promise<unknown>;
                return askOfStub(askInput);
              },
            },
          },
        } as unknown as ContextBrain<BrainChoice>;
        const measured = await setOnePrefixPoke(
          {
            cwd,
            reviewer: 'repo-rules',
            head: HEAD_OF_TEST,
            tail: TAIL_OF_TEST,
            msOfTimeout: null,
          },
          { brain },
        );
        return { asks, measured };
      });

      when('[t0] the poke is sent', () => {
        then('🔴 the poke asks again after the transient fault', () => {
          expect(scene.asks.length).toEqual(2);
        });

        then('and reports the measurement of the ask that answered', () => {
          expect(scene.measured.cacheGetTokens).toEqual(998);
          expect(scene.measured.promptTokens).toEqual(1_000);
        });

        then(
          '🔴 and hands back the fault it swallowed, since a 502 may close after the provider billed',
          () => {
            expect(scene.measured.faultsSwallowed).toHaveLength(1);
            expect(
              (scene.measured.faultsSwallowed[0]?.error as Error).message,
            ).toEqual('502 bad gateway');
          },
        );
      });
    },
  );

  given('[case4] a poke sent to the real provider', () => {
    /**
     * .why = the stubs above prove the SHAPE of the call. this proves the provider
     *        accepts that shape — the head in the system slot, the ack schema — and
     *        answers with every field a poke row reads. one tiny prompt, so the cost
     *        is a fraction of a cent (rule.require.external-contract-integration-tests)
     * .note = the head carries a fresh marker, so no prior run's cache can answer it;
     *         a cache read is not asserted here, only that the provider measured one
     */
    when.repeatably(REPEATABLY_CONFIG)('[t0] the poke is sent', () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'poke-live' });
        const answer = await setOnePrefixPoke(
          {
            cwd,
            reviewer: 'repo-rules',
            head: `${HEAD_OF_TEST}\nmarker: ${getUuid()}\n`,
            tail: TAIL_OF_TEST,
            msOfTimeout: null,
          },
          { brain: await genTestBrainContext({ brain: DEFAULT_TEST_BRAIN }) },
        );
        return { answer };
      });

      then('the provider measured the prompt it read', () => {
        expect(scene.answer.promptTokens).toBeGreaterThan(0);
      });

      then('the cache read is a measured count, never absent', () => {
        expect(Number.isInteger(scene.answer.cacheGetTokens)).toEqual(true);
        expect(scene.answer.cacheGetTokens).toBeGreaterThanOrEqual(0);
        expect(scene.answer.cacheGetTokens).toBeLessThanOrEqual(
          scene.answer.promptTokens,
        );
      });

      then('the cost is a price the poke row can render', () => {
        expect(scene.answer.cost).toMatch(/^\$\d/);
      });
    });
  });
});
