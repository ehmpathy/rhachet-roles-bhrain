import * as fs from 'fs/promises';
import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardReviewSelfArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewSelfArtifact';

/**
 * .what = records a promise artifact for a self-review
 * .why = enables track of which self-reviews have been promised for current artifact state
 */
export const setStoneAsPromised = async (input: {
  stone: RouteStone;
  slug: string;
  hash: string;
  route: string;
}): Promise<{ promise: RouteStoneGuardReviewSelfArtifact }> => {
  // ensure .route directory found or created
  const routeDir = path.join(input.route, '.route');
  await fs.mkdir(routeDir, { recursive: true });

  // compute promise artifact path
  const promisePath = path.join(
    routeDir,
    `${input.stone.name}.guard.promise.${input.slug}.${input.hash}.md`,
  );

  // write promise content
  const timestamp = new Date().toISOString();
  const content = `# promise: ${input.slug}

- stone: ${input.stone.name}
- hash: ${input.hash}
- timestamp: ${timestamp}

---

i promise i have completed the self-review for "${input.slug}".
`;

  await fs.writeFile(promisePath, content);

  // return promise artifact
  return {
    promise: new RouteStoneGuardReviewSelfArtifact({
      stone: { path: input.stone.path },
      hash: input.hash,
      slug: input.slug,
      path: promisePath,
    }),
  };
};
