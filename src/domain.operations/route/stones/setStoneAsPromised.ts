import * as fs from 'fs/promises';
import * as path from 'path';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardReviewSelfArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewSelfArtifact';

import { setPassageReport } from '../passage/setPassageReport';

/**
 * .what = records a promise artifact for a self-review + a passage entry
 * .why = enables track of which self-reviews have been promised, and records the
 *        forward motion so a prior blocker clears (rule.require.forward-motion-
 *        clears-blocker): a --as promised means the driver is over the blocker
 *
 * .note = all promises are hashless (firm checkpoints that don't invalidate)
 */
export const setStoneAsPromised = async (input: {
  stone: RouteStone;
  slug: string;
  route: string;
}): Promise<{ promise: RouteStoneGuardReviewSelfArtifact }> => {
  // ensure .route directory found or created
  const routeDir = path.join(input.route, '.route');
  await fs.mkdir(routeDir, { recursive: true });

  // compute promise artifact path (hashless — no hash in filename)
  const promisePath = path.join(
    routeDir,
    `${input.stone.name}.guard.promise.${input.slug}.md`,
  );

  // write promise content
  const content = `# promise: ${input.slug}

- stone: ${input.stone.name}

---

i promise i have completed the review.self for "${input.slug}".
`;

  await fs.writeFile(promisePath, content);

  // record the forward motion in passage.jsonl so a prior blocker clears
  // .why = rule.require.forward-motion-clears-blocker — the latest entry wins, so
  //        this 'promised' status supersedes a stale escalation halt; its disposition
  //        is push (the machine's own self-review work), so the route self-drives on
  await setPassageReport({
    report: new PassageReport({
      stone: input.stone.name,
      status: 'promised',
      reason: `promised review.self: ${input.slug}`,
    }),
    route: input.route,
  });

  // return promise artifact
  return {
    promise: new RouteStoneGuardReviewSelfArtifact({
      stone: { path: input.stone.path },
      hash: 'hashless',
      slug: input.slug,
      path: promisePath,
    }),
  };
};
