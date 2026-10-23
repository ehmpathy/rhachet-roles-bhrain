import { isTargetPolluter } from '@src/domain.operations/isTargetPolluter';
import { isPathMatchedByGlob } from '@src/domain.operations/review/isPathMatchedByGlob';

/**
 * .what = the polluters a caller ASKED FOR BY NAME, and so must keep
 *
 * .why = a polluter is defined against the scope, never against the repo
 *        (`term=review.scope.polluter`). a route's paperwork pollutes a lane
 *        that reviews code, but is the whole subject of a lane that reviews
 *        the route's own deliverable — this repo holds 78 such binds across
 *        38 guards, e.g.
 *        `--diffs since-main --paths-with '$route/3.3.blueprint.*.md' --join intersect`.
 *        a side-blind drop resolves that lane to zero files and refuses
 *        before the brain is reached, so the drop must part the incidental
 *        source (a `--diffs` range, whatever changed) from the deliberate one
 *        (a `--paths` glob, what somebody typed)
 *
 * .the bound — a glob exempts only where every target it matched is a polluter
 *
 *        the naive form ("matched by any positive glob") hands `--paths-with
 *        '**' + '/*'` a total exemption, which voids the default on exactly
 *        the widest lanes it exists for. so a glob earns the exemption only
 *        when specific — named paperwork and naught else — computed from the
 *        matched set rather than parsed from the pattern, so no glob grammar
 *        is reimplemented:
 *
 *          | the glob                      | matched                | specific? |
 *          |-------------------------------|------------------------|-----------|
 *          | `$route/3.3.blueprint.*.md`   | route artifacts only   | yes       |
 *          | `src/` + `**` + `/*.ts`       | source only            | no — none are polluters |
 *          | a bare catch-all              | source AND paperwork   | no        |
 *
 * .the residual hole, stated plainly = a catch-all glob over a corpus that
 *    happens to hold only polluters reads as specific, so no file drops. this
 *    is benign: a scope of pure paperwork would otherwise refuse as empty, so
 *    the caller sees their files rather than a halt either way
 */
export const getAllTargetsAskedForByName = (input: {
  targets: string[];
  globs: string[];
}): string[] => {
  const globsSpecific = input.globs.filter((glob) =>
    isGlobSpecificToPolluters({ glob, targets: input.targets }),
  );

  return input.targets.filter((target) =>
    isPathMatchedByAnyGlob({ path: target, globs: globsSpecific }),
  );
};

/**
 * .what = whether a glob matched at least one target and every one it matched is a polluter
 * .why = such a glob named paperwork, and named naught besides — so it asked for it
 */
const isGlobSpecificToPolluters = (input: {
  glob: string;
  targets: string[];
}): boolean => {
  const matched = input.targets.filter((target) =>
    isPathMatchedByGlob({ path: target, glob: input.glob }),
  );
  if (matched.length === 0) return false;
  return matched.every((target) => isTargetPolluter({ path: target }));
};

/**
 * .what = whether a path is matched by at least one of the globs
 */
const isPathMatchedByAnyGlob = (input: {
  path: string;
  globs: string[];
}): boolean =>
  input.globs.some((glob) => isPathMatchedByGlob({ path: input.path, glob }));
