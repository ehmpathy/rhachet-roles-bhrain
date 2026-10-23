/**
 * .what = the route VARIANT dirs — each holds `<variant>/v$isodate.$slug/` routes
 * .why = `.behavior` is one variant, never the route root — `howto.create-routes`
 *        declares `.route/` (default), `.behavior/` (behavior-driven routes),
 *        and `.$custom/` (custom variants). a behavior is a specific kind of
 *        route, so a rule keyed on `.behavior` alone would let every
 *        `.route/v*` route's paperwork through — this repo runs seven of them
 *
 * .note = the variant is matched at the repo root only, deliberately. a
 *         structural detector ("any dir with a `.route/` inside") has seven
 *         false positives in this repo alone — 33 files under the thinker
 *         role's draft dirs, none of them routes. keyed structurally, "all
 *         except the allowlist" would drop the whole thinker role from every
 *         review scope, and the review would still run clean. route
 *         discovery may key structurally (`getAllBindFlagsByBranch` globs for
 *         a `.bind.$branch.flag` inside `.route/`), because a bind flag is
 *         the discriminator there — this predicate has no flag to lean on
 *
 * .note = only the two variants this repo uses are admitted. a `.$custom/`
 *         variant has no name to list until someone mints it, and a guessed
 *         pattern would reopen the structural false positives above — its
 *         paperwork rides into scope, visible, rather than a real dir
 *         dropped in silence
 */
const SEGMENTS_OF_ROUTE_VARIANT = new Set(['.route', '.behavior']);

/**
 * .what = the dir that holds this repo's caught dreams
 * .why = a dream is a FUTURE task. it names work nobody has done, so a reviewer
 *        who reads one grades an intention rather than an artifact
 */
const SEGMENT_OF_DREAM_ROOT = '.dream';

/**
 * .what = machine-written dependency lockfiles
 * .why = a human never authors one and a reviewer can never usefully grade one.
 *        `pnpm-lock.yaml` alone measured 31.4k chars — 1.3% of the largest real
 *        prompt on this branch — of pure transitive-resolution noise
 */
const NAMES_OF_LOCKFILE = new Set([
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
]);

/**
 * .what = the repo-root dir that holds machine-written run logs — `rhx review`'s own among them
 * .why = a review writes its scope, its token census, and its prompt under `.log/` before it
 *        sends a byte. in a repo that does not gitignore `.log/`, those files read as changed
 *        since main, so the next round reviews the last round's own logs, and a declared
 *        partition set is refused for files no partition could ever owe a verdict on
 *
 * .note = matched at the repo root only, like the route variant: a `src/.log/` dir is the
 *         repo's own business, and a guessed nested match would drop it in silence
 */
const SEGMENT_OF_LOG_ROOT = '.log';

/**
 * .what = the route-root dirs a reviewer DOES read, whole
 * .why = `.seeds/**` holds the wisher's verbatim words — few, short, and each one binds
 */
const DIRS_OF_ROUTE_ARTIFACT_ALLOWED = ['.seeds'];

/**
 * .what = the route-root dirs a reviewer reads by their cluster ROOT only — `$dir/*._.md`
 * .why = `.fulcrums/` holds the design forks a reviewer must weigh, and its summary
 *        (`inventory.of=fulcrums._.md`) states every fork in one row: title, rework,
 *        status, confidence. the case files behind those rows are the argument, and
 *        most are already ruled. measured on this repo's own route: 187 case files,
 *        17.0% of every review's target mass, re-sent once per lane per round
 *
 * .note = a lane that must weigh one case names it, and is kept: a glob that matches
 *         only paperwork exempts what it matched (`getAllTargetsAskedForByName`), so
 *         `--paths-with '$route/.fulcrums/*F26*'` reads F26 and naught else
 */
const DIRS_OF_ROUTE_ARTIFACT_SUMMARY_ONLY = ['.fulcrums'];

/**
 * .what = the leaf suffix that marks a cluster root — the summary of a split subject
 */
const SUFFIX_OF_CLUSTER_ROOT = '._.md';

/**
 * .what = the leaf suffix a reviewer DOES read, at any depth
 * .why = `*.yield.md` is what each stage actually produced, and a stage may nest it
 */
const SUFFIX_OF_ROUTE_ARTIFACT_ALLOWED = '.yield.md';

/**
 * .what = the allowlist as a human reads it — `.fulcrums/*._.md, .seeds/**, *.yield.md`
 * .why = the empty-scope refusal tells a driver what was kept. derived from the
 *        constants the predicate reads, so a new admitted kind reaches the hint
 *        in the same edit that admits it
 */
export const HUMAN_OF_ROUTE_ARTIFACT_ALLOWED = [
  ...DIRS_OF_ROUTE_ARTIFACT_SUMMARY_ONLY.map(
    (dir) => `${dir}/*${SUFFIX_OF_CLUSTER_ROOT}`,
  ),
  ...DIRS_OF_ROUTE_ARTIFACT_ALLOWED.map((dir) => `${dir}/**`),
  `*${SUFFIX_OF_ROUTE_ARTIFACT_ALLOWED}`,
].join(', ');

/**
 * .what = whether a route-internal path is one of the three a reviewer DOES read
 * .why = an allowlist rather than a denylist, since a route grows new artifact
 *        kinds every few weeks and a denylist goes stale in silence. a new
 *        kind is excluded by default and must be argued in
 *
 * .note = the three shapes live in the constants above and nowhere else in code
 */
const isRouteArtifactAllowed = (input: { within: string[] }): boolean => {
  const head = input.within[0];
  const leaf = input.within[input.within.length - 1];

  // a whole allowed dir, at the route root
  if (head && DIRS_OF_ROUTE_ARTIFACT_ALLOWED.includes(head)) return true;

  // a summary-only dir admits its cluster root, directly inside it, and no case behind it
  if (head && DIRS_OF_ROUTE_ARTIFACT_SUMMARY_ONLY.includes(head))
    return (
      input.within.length === 2 && !!leaf?.endsWith(SUFFIX_OF_CLUSTER_ROOT)
    );

  // an allowed leaf, at any depth
  if (leaf?.endsWith(SUFFIX_OF_ROUTE_ARTIFACT_ALLOWED)) return true;

  return false;
};

/**
 * .what = whether a target file POLLUTES the review scope and must be dropped
 * .why = a review prompt that carries a route's own paperwork pays twice: in
 *        money, and in the independence of the verdict. the money is
 *        measured — over the largest real prompt this branch produced
 *        (2,507.7k chars, 251 targets), the `.dream/` tree and route
 *        `dreams/` (same bytes) plus `pnpm-lock.yaml` totaled 348.0k chars,
 *        13.9%. the second cost is one no meter can see: a route's
 *        `.reviews/peer/**` holds what other lanes concluded about this same
 *        artifact, so a lane whose scope includes them can echo a peer's
 *        verdict — which makes N independent reviews less independent than
 *        their count claims
 *
 * .note = the decision applies after the join, never as a negative glob.
 *         `enumFilesFromGlob` reaches only the `--paths` side; a `--diffs`
 *         range never has negatives applied, so an exclusion expressed as a
 *         glob would bind one source and read as though it bound both
 *
 * .note = a SHARED exposure of the review domain, by declaration: it is the one
 *         answer to "what may a reviewer read", and two contexts hand a
 *         reviewer a scope. to copy it would let the two scopes drift, which is
 *         the defect it exists to prevent. its readers:
 *         - `stepReview` (the scope filter, which drops)
 *         - `stepReview` scope debug (the record of what it dropped)
 *         - `route/guard/review/getAllStoneGuardReviewTargetPaths` (the `$targets` list a
 *           peer lane receives, which claims parity with `rhx review`)
 *         - `asReviewScopeEmptyRefusalLines` (the `kept:` hint, via
 *           `HUMAN_OF_ROUTE_ARTIFACT_ALLOWED`)
 *         - `isTargetPolluter.test` (the clamp that checks every class)
 *         a new reader of the scope belongs on this list before it ships
 */
export const isTargetPolluter = (input: { path: string }): boolean => {
  const segments = input.path.split('/').filter((segment) => segment !== '.');

  // the repo's dream queue, wherever it is reached from
  //
  // this does not catch a route's `dreams/` symlink dir — that path is
  // `<variant>/<slug>/dreams/…`, with no `.dream` segment at all. the route
  // clause below is what drops it, by way of the allowlist (`[case2]` clamps
  // it). a `dreams` dir name alone means naught: `docs/dreams/why.md` is kept
  if (segments.includes(SEGMENT_OF_DREAM_ROOT)) return true;

  // a lockfile — machine-written, and nobody reviews one
  const leaf = segments[segments.length - 1];
  if (leaf && NAMES_OF_LOCKFILE.has(leaf)) return true;

  // a machine-written run log, at the repo root — the review's own among them
  if (segments[0] === SEGMENT_OF_LOG_ROOT && segments.length > 1) return true;

  // a route's own artifacts, except the three a reviewer reads.
  // the variant is the FIRST segment — see the bound argued on the constant
  const variant = segments[0];
  if (!variant || !SEGMENTS_OF_ROUTE_VARIANT.has(variant)) return false;

  // past `<variant>/<slug>` — a path with naught after the slug names no file
  const within = segments.slice(2);
  if (within.length === 0) return false;

  return !isRouteArtifactAllowed({ within });
};
