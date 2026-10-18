import { ConstraintError } from 'helpful-errors';
import { homedir } from 'os';
import { join } from 'path';
import { genContextBrain } from 'rhachet';
import { genBrainAtom } from 'rhachet-brains-openrouter';
import { castToSafeOnDiskCacheKey, createCache } from 'simple-on-disk-cache';
import { z } from 'zod';

/**
 * .what = the tier the tests and the product default ride on
 */
export const BRAIN_TIER = 'openrouter/deepseek/flash';

/**
 * .what = how long one probe ask may run
 * .why = a hung provider must fail the setup, never hold the run
 */
const PROBE_TIMEOUT_MS = 60_000;

/**
 * .what = the openrouter reads and writes that hold a tier's pick
 * .why = one seam for the i/o, so the orchestrator is tested with fakes
 */
export const sdkBrainTierPick = {
  /**
   * .what = asks one brain a tiny question, and reports whether it answered
   * .why = the package's own refusal is the qualify check, so no host rule is copied here
   *
   * .note = a refusal for the promises costs no tokens: the package sends no call
   */
  getOneProbeVerdict: async (input: {
    slug: string;
  }): Promise<{ qualified: true } | { qualified: false; error: string }> => {
    // build the brain from the slug alone, with the same creds every test brain uses
    const brain = await genContextBrain({
      brains: {
        atoms: [genBrainAtom({ slug: input.slug as never })],
        repls: [],
      },
      choice: input.slug,
      creds: { keyrack: { owner: 'ehmpath', env: 'test' } },
    });

    // race the ask against a bound, and clear the timer either way
    // .note = deliberate mutation: the cancellable timer handle, assigned in the executor
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`probe ask exceeded ${PROBE_TIMEOUT_MS}ms`)),
        PROBE_TIMEOUT_MS,
      );
    });
    try {
      await Promise.race([
        brain.brain.choice.ask({
          role: {},
          prompt: 'reply with the word ok',
          schema: { output: z.object({ reply: z.string() }) },
        }),
        timeout,
      ]);
      return { qualified: true };
    } catch (error) {
      return {
        qualified: false,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      if (timer) clearTimeout(timer);
    }
  },

  /**
   * .what = the catalog rows of openrouter, id and age alone
   * .why = the catalog read is public; the tier line is applied on our side
   */
  getAllCatalogModels: async (): Promise<
    { id: string; created: number; expiration_date: string | null }[]
  > => {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    if (!response.ok)
      throw new ConstraintError('openrouter catalog read failed', {
        status: response.status,
      });
    const body = (await response.json()) as {
      data: {
        id: string;
        created: number;
        expiration_date?: string | null;
      }[];
    };
    return body.data.map((model) => ({
      id: model.id,
      created: model.created,
      expiration_date: model.expiration_date ?? null,
    }));
  },

  /**
   * .what = holds the tier's pick on this machine for 7 days, as the brains package does
   * .why = the package holds one pick per machine for a week. a machine with no pick takes
   *        the newest model at its first ask. this writes the same entry the package writes
   *
   * .note = the key and the store mirror the package (asOpenRouterCacheKey,
   *         cacheOpenRouterOnDisk). the probe after the write proves the package reads it
   */
  setTierPickHeld: async (input: { model: string }): Promise<void> => {
    const cache = createCache({
      directory: {
        local: {
          path: join(
            homedir(),
            '.rhachet/storage/repo=openrouter/role=any/cache',
          ),
        },
      },
      consistency: 'memory-first',
    });
    await cache.set(
      castToSafeOnDiskCacheKey({
        procedure: { name: 'openrouter.tier-pick', version: '1' },
        execution: { input: { model: BRAIN_TIER } },
      }),
      JSON.stringify({ model: input.model }),
      { expiration: { days: 7 } },
    );
  },
};
