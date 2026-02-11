/**
 * .what = fast cli entrypoint for skill invocation
 * .why = avoids heavy imports (getRoleRegistry, stepReview) until needed
 *        shell skills import from 'rhachet-roles-bhrain/cli' for fast startup
 */
import { reflect } from './reflect';
import { researchInit } from './research';
import { review } from './review';
import {
  routeBind,
  routeStoneDel,
  routeStoneGet,
  routeStoneJudge,
  routeStoneSet,
} from './route';

export const cli = {
  review,
  reflect,
  route: {
    bind: routeBind,
    stone: {
      get: routeStoneGet,
      set: routeStoneSet,
      del: routeStoneDel,
      judge: routeStoneJudge,
    },
  },
  research: {
    init: researchInit,
  },
};
