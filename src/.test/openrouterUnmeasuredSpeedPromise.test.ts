import { getAllQualifiedEndpoints } from 'rhachet-brains-openrouter/dist/domain.operations/supply/getAllQualifiedEndpoints';
import { getError, given, then, when } from 'test-fns';

/**
 * .what = clamps the local patch of rhachet-brains-openrouter's speed promise
 * .why = a fresh release (deepseek-v4.1-flash-1017, 2026-10-17) had no host with a measured
 *        throughput, so every speed-promised slug refused before a call was sent. that included
 *        the product default `openrouter/deepseek/flash`, whose tier implies min50tps. the patch
 *        waives the promise while no host is measured, and keeps it once any host is. this goes
 *        red the moment a version bump or a dropped patch reverts it
 */
type QualifyInput = Parameters<typeof getAllQualifiedEndpoints>[0];

/**
 * .what = an endpoint stub that keeps every promise but speed
 * .why = the clamp isolates the speed check; only the fields the checks read are set
 */
const genEndpoint = (input: { tag: string; throughputTps: number | null }) => ({
  tag: input.tag,
  throughputTps: input.throughputTps,
  supportedParameters: ['response_format', 'structured_outputs'],
  zdr: true,
  quantization: 'fp8',
  pricePromptUsdPerToken: 0.1e-6,
  priceCompletionUsdPerToken: 0.4e-6,
});

/**
 * .what = runs the qualify step with a min100tps promise over the given endpoints
 * .why = mirrors the test brain's slug, so the clamp covers the promise that refused in ci
 */
const runQualify = (input: {
  endpoints: ReturnType<typeof genEndpoint>[];
}): ReturnType<typeof getAllQualifiedEndpoints> =>
  getAllQualifiedEndpoints({
    model: 'deepseek/deepseek-v4.1-flash-1017',
    endpoints: input.endpoints,
    filters: {
      floor: true,
      speedMinTps: 100,
      region: null,
      precision: null,
      privacy: 'full',
      priceMaxUsdPerMillion: null,
    },
    paramsRequired: ['response_format', 'structured_outputs'],
    tagsJsonIgnored: [],
    tokens: { input: 1000 },
  } as unknown as QualifyInput); // .note = a stub of the third-party contract; only the fields the checks read

describe('openrouterUnmeasuredSpeedPromise', () => {
  given('[case1] a fresh release where no host is measured yet', () => {
    when('[t0] a min100tps slug qualifies its hosts', () => {
      then('every host qualifies, since no speed can be judged', () => {
        const result = runQualify({
          endpoints: [
            genEndpoint({ tag: 'inference-net/fp8', throughputTps: null }),
            genEndpoint({ tag: 'deepinfra/fp8', throughputTps: null }),
          ],
        });
        expect(result.qualified.map((e) => e.tag)).toEqual([
          'inference-net/fp8',
          'deepinfra/fp8',
        ]);
      });
    });
  });

  given('[case2] a release where some hosts are measured', () => {
    when('[t0] a min100tps slug qualifies its hosts', () => {
      then('only a measured host that meets the promise qualifies', () => {
        const result = runQualify({
          endpoints: [
            genEndpoint({ tag: 'slow/fp8', throughputTps: 40 }),
            genEndpoint({ tag: 'fast/fp8', throughputTps: 140 }),
            genEndpoint({ tag: 'unmeasured/fp8', throughputTps: null }),
          ],
        });
        expect(result.qualified.map((e) => e.tag)).toEqual(['fast/fp8']);
      });
    });
  });

  given('[case3] every measured host is slow', () => {
    when('[t0] a min100tps slug qualifies its hosts', () => {
      then('it refuses loud, and names the speed promise', async () => {
        const error = await getError(async () =>
          runQualify({
            endpoints: [
              genEndpoint({ tag: 'slow/fp8', throughputTps: 40 }),
              genEndpoint({ tag: 'unmeasured/fp8', throughputTps: null }),
            ],
          }),
        );
        expect(error.message).toContain('speed>=100tps');
      });
    });
  });
});
