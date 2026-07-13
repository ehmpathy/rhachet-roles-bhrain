import * as fs from 'fs/promises';
import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardReviewSelfArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewSelfArtifact';

/**
 * .what = records a promise artifact for a self-review
 * .why = enables track of which self-reviews have been promised
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
