// a sanctioned exposure, declared in src/domain.operations/review/partition/.readme.md
import { asReviewPartitionDeclarationParts } from '@src/domain.operations/review/partition/asReviewPartitionDeclarationParts';
import { asReviewPartitionDeclarationText } from '@src/domain.operations/review/partition/asReviewPartitionDeclarationText';

import { asRouteGuardPartitionCommand } from './asRouteGuardPartitionCommand';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

/**
 * .what = the refusal a claim into a slug the scope does not hold earns — the slugs it holds,
 *         and the two moves that close it
 * .why = 🔴 a claim never creates a partition: a typo would otherwise mint a one-glob partition
 *        no one named. so it refuses, lists every held slug, and prints both fixes paste-ready:
 *        claim into a held slug, or declare the new domain with the whole set
 *        (rule.require.errors-name-the-fix)
 */
export const asRouteGuardPartitionClaimRefusal = (input: {
  unknownInto: string[];
  /** the set the scope holds */
  held: string[];
  claims: Array<{ glob: string; into: string }>;
  route: string;
  scope: RouteGuardPartitionScope;
}): { headline: string; lines: string[] } => {
  // the slugs the scope holds, in declared order
  const slugsHeld = input.held.map(
    (value) => asReviewPartitionDeclarationParts({ value }).slug,
  );
  const command = asRouteGuardPartitionCommand({
    route: input.route,
    scope: input.scope,
  });

  // the whole set with each unknown slug declared as a new domain, its globs and the route
  const declared = [
    ...input.held,
    ...input.unknownInto.map(
      (slug) =>
        `${slug}=${[
          ...input.claims
            .filter((claim) => claim.into === slug)
            .map((claim) => claim.glob),
          `${input.route}/**`,
        ].join(',')}`,
    ),
  ];
  return {
    headline: `--into ${input.unknownInto.join(', ')}: the scope holds no partition by that name, and a claim never creates one`,
    lines: [
      '   ├─ held partitions',
      ...slugsHeld.map(
        (slug, index) =>
          `   │  ${index === slugsHeld.length - 1 ? '└─' : '├─'} ${slug}`,
      ),
      '   ├─ fix: claim into a held partition — --into <one of the above>',
      '   └─ or declare the new domain, with the whole set',
      ...asReviewPartitionDeclarationText({ partition: declared, command })
        .split('\n')
        .map((line) => `      ${line}`),
    ],
  };
};
