import * as path from 'path';

/**
 * .what = the one filename template for a self-review promise artifact
 * .why = single source of truth for the promise's key, so no call site can derive it differently
 *
 * .note = the key is (stone, slug) — hashless. a promise is a firm checkpoint that does not
 *         invalidate, so no generation of the artifact under review can re-key it.
 * .note = `slug: '*'` yields the glob, so the template and every glob over it share one string
 *         rather than two that must be held in agreement by hand.
 */
const asFilename = (input: { stone: string; slug: string }): string =>
  `${input.stone}.guard.promise.${input.slug}.md`;

/**
 * .what = computes the promise artifact path for one (stone, slug)
 * .why = the writer and the reader must agree on one filename, and an agreement held by two
 *        hand-typed literals is an agreement no mechanism enforces
 */
export const getStonePromisePaths = (input: {
  stone: string;
  slug: string;
  route: string;
}): { promisePath: string; filename: string } => {
  const filename = asFilename({ stone: input.stone, slug: input.slug });
  return {
    filename,
    promisePath: path.join(input.route, '.route', filename),
  };
};

/**
 * .what = the glob that reaches every promise of one stone, relative to the route
 * .why = `enumRouteFiles` takes a route-relative glob
 */
export const asStonePromiseGlob = (input: { stone: string }): string =>
  `.route/${asFilename({ stone: input.stone, slug: '*' })}`;

/**
 * .what = the glob that reaches every promise of one stone, relative to the `.route` dir
 * .why = `enumFilesFromGlob` is called with `cwd: routeDir`, so it takes a bare filename glob
 *
 * 🔴 .note = this is a SECOND named export rather than a `scope: 'route' | 'dir'` flag on one.
 *            a boolean or enum that selects between two disjoint returns bifurcates an
 *            operation whose halves share no logic — the defect a peer lane has now named
 *            three rounds running on `sinceOnly`. two names, one template, no branch.
 */
export const asStonePromiseFilenameGlob = (input: { stone: string }): string =>
  asFilename({ stone: input.stone, slug: '*' });

/**
 * .what = parses the slug back out of a promise filename
 * .why = the inverse of the template, and it must be held against the SAME string the template
 *        is built from — a parser that drifts from its writer drops a promise in silence
 *
 * 🔴 .note = the slug may carry a dot, so this must NOT be `[^.]+`. that narrower form cannot
 *            span a dot, so a dotted slug matched naught, the caller's `if (slug)` dropped the
 *            file in silence, and the driver's promise was invisible — re-handed the same slug
 *            forever (rule.forbid.failhide). `.+` is greedy and `\.md$` anchors it, so
 *            `all-done` and `i1.p1` both round trip. clamped at getStonePromises.test.ts [case5]
 */
export const asStonePromiseSlug = (input: {
  filename: string;
}): string | null => {
  const match = input.filename.match(/\.guard\.promise\.(.+)\.md$/);
  return match?.[1] ?? null;
};
