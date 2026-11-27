import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { getGuardSelfReviews } from '@src/domain.objects/Driver/RouteStoneGuard';
import { parseStoneGuard } from '@src/domain.operations/route/guard/parseStoneGuard';

/**
 * .what = every guard the education routes ship, as a path from this dir
 */
const GUARD_TEMPLATES = [
  'pursuit/templates/1.courses.plot.guard',
  'pursuit/templates/2.courses.pursue.guard',
  'pursuit/templates/4.graduate.guard',
  'course/templates/2.2.greats.read.guard',
  'course/templates/4.1.entool.blueprint.guard',
  'course/templates/6.exit.guard',
];

/**
 * .what = the guard templates of both education routes, read by the guard reader itself
 * .why = a guard is read only when a driver arrives at its stone. a yaml slip in one, or a
 *        self-review slug the stone text no longer names, would first show on a live drive.
 *        the `2.2` and `4.1` self reviews are the route's one defence against a false kernel
 */
describe('education guards, read by the guard reader', () => {
  given('[case1] the guards the pursuit and course templates ship', () => {
    when('[t0] each is parsed as the guard reader parses it', () => {
      const parsed = useThen('each parses', async () => ({
        guards: await Promise.all(
          GUARD_TEMPLATES.map(async (template) => ({
            template,
            guard: await parseStoneGuard({
              path: path.join(__dirname, template),
            }),
          })),
        ),
      }));

      then('every guard parses, and names an artifact or a judge', () => {
        for (const { guard } of parsed.guards)
          expect(guard.artifacts.length + guard.judges.length).toBeGreaterThan(
            0,
          );
      });

      then('the 2.2 and 4.1 guards hold their self reviews', () => {
        const slugsOf = (template: string): string[] =>
          getGuardSelfReviews(
            parsed.guards.find((one) => one.template === template)!.guard,
          ).map((review) => review.slug);
        expect(slugsOf('course/templates/2.2.greats.read.guard')).toEqual([
          'has-cited-every-kernel-to-a-page-read',
          'has-tagged-claims-honestly',
        ]);
        expect(slugsOf('course/templates/4.1.entool.blueprint.guard')).toEqual([
          'has-traced-every-yield-to-a-held-claim',
          'has-traced-every-yield-to-an-outcome',
        ]);
      });

      then(
        'no self-review prompt names `$route`, which the harness leaves literal in `say`',
        () => {
          const prompts = parsed.guards.flatMap(({ guard }) =>
            getGuardSelfReviews(guard).map((review) => review.say),
          );
          expect(prompts.length).toBeGreaterThan(0);
          for (const say of prompts) expect(say).not.toContain('$route');
        },
      );

      then('each guard reads as the snapshot shows', () => {
        expect(
          parsed.guards.map(({ template, guard }) => ({
            template,
            artifacts: guard.artifacts,
            judges: guard.judges,
            selfReviews: getGuardSelfReviews(guard).map((review) => ({
              slug: review.slug,
              say: review.say,
            })),
          })),
        ).toMatchSnapshot();
      });
    });
  });
});
