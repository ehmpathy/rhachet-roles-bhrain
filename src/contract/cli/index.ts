/**
 * .what = the aggregate cli entrypoint, kept for consumers that import it by name
 * .why = a published export; to drop a member would break whoever reads it
 *
 * .note = `review`, `reviewBy`, and `reflect` carry brain imports — the oom footgun
 *          `rule.require.isolated-cli-subpath-exports` names. so each is a lazy member: its
 *          module loads only when that member is called, and an import of this aggregate
 *          never loads `rhachet/brains`. every skill in this repo still imports its own
 *          subpath (`cli/route`, `cli/review`, `cli/review._.cost`, `cli/research`, …), and
 *          a new command gets a subpath, never an eager member here
 */
import { researchInit } from './research';
import {
  routeBindDel,
  routeBindGet,
  routeBindSet,
  routeBounce,
  routeDrive,
  routeReview,
  routeStoneDel,
  routeStoneGet,
  routeStoneJudge,
  routeStoneSet,
} from './route';
import {
  routeReminderDaemon,
  routeReminderDel,
  routeReminderGen,
  routeReminderGet,
} from './route.reminder';

/**
 * .what = lazy members for the three brain-bound commands
 * .why = the module (and its brain imports) loads on call, never on an import of the aggregate
 * .note = a typed `require`, not `import()`: under node16 a dynamic `import()` in a commonjs file
 *         looks up its path in esm mode and demands a file extension, which the jest `@src`
 *         mappers cannot follow. `require` and `typeof import()` look up in commonjs mode
 */
const review = async (): Promise<void> => {
  const mod: typeof import('./review') = require('./review');
  return mod.review();
};
const reviewBy = async (): Promise<void> => {
  const mod: typeof import('./review.by') = require('./review.by');
  return mod.reviewBy();
};
const reflect = async (): Promise<void> => {
  const mod: typeof import('./reflect') = require('./reflect');
  return mod.reflect();
};

export const cli = {
  review,
  reviewBy,
  // reviewCost is absent by design — it is reached only via its own subpath
  // (`cli/review._.cost`)
  reflect,
  route: {
    bind: {
      set: routeBindSet,
      get: routeBindGet,
      del: routeBindDel,
    },
    bounce: routeBounce,
    drive: routeDrive,
    review: routeReview,
    stone: {
      get: routeStoneGet,
      set: routeStoneSet,
      del: routeStoneDel,
      judge: routeStoneJudge,
    },
    reminder: {
      gen: routeReminderGen,
      get: routeReminderGet,
      del: routeReminderDel,
      daemon: routeReminderDaemon,
    },
  },
  research: {
    init: researchInit,
  },
};
