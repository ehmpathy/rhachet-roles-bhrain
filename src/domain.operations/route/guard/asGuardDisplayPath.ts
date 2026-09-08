import * as path from 'path';

/**
 * .what = casts an absolute guard artifact path into the form a driver reads
 * .why = every guard surface that prints a review or judge artifact prints it
 *        relative to the repo root, so a driver can paste it into an editor
 *        without a `/tmp/...`-length prefix to scroll past.
 *
 *        it exists as one named operation because the rule was held by
 *        convention at five call sites and one of them dropped it: the
 *        fresh-run progress emit handed `review.path` raw while its three
 *        siblings — cached, exhausted, and cached-with-blockers — each wrote
 *        `path.relative(gitRoot, ...)` inline. so a single stone run printed
 *        the same artifact two ways, fifteen lines apart: an absolute path in
 *        the progress tree, a repo-relative one in the guard report below it
 *        (r7 nitpick.1, i003).
 *
 * ⇒ a convention repeated at five sites is not a guarantee. this is.
 *
 * .note = it is the THIRD `*DisplayPath` operation in this repo, and the three
 *         deliberately disagree on two edge cases. that is not drift — each
 *         serves a different surface:
 *
 *         | operation | root | path IS the root | path escapes the root |
 *         |---|---|---|---|
 *         | `asRouteDisplayPath` | `process.cwd()` | `'.'` — a `route = ` line cannot render empty | a `..` crawl |
 *         | `getReviewDisplayPath` | caller's cwd | `''` | the ABSOLUTE form — a crawl reads worse |
 *         | this one | the repo root | `''` | a `..` crawl |
 *
 *         this one needs neither special case, and the reason is structural
 *         rather than a bet: a guard artifact is written under `$route/.reviews`
 *         or `$route/.judges`, and the route is under the repo root — so the
 *         artifact is always a strict descendant of `root`. it can be neither
 *         equal to it (which would yield `''`) nor outside it (which would yield
 *         a `..` crawl). `[case14]` of the runStoneGuardReviews suite pins both
 *         halves of that invariant rather than the one, precisely because
 *         `path.isAbsolute` alone would pass on a `..` crawl.
 */
export const asGuardDisplayPath = (input: {
  /**
   * the absolute path of the artifact, as the filesystem enumerated it
   */
  pathAbsolute: string;

  /**
   * the root to render against — the git repo root, or the cwd fallback
   * that `getRepoRootWithFallback` supplies outside a repo
   */
  root: string;
}): string => path.relative(input.root, input.pathAbsolute);
