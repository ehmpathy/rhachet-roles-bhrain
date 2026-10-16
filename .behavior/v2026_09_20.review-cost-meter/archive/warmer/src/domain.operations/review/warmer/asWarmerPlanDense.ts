import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = one warmer plan, dense, as every warmer surface renders it
 * .why = the bound lines set the live and the asked plan side by side, and the
 *        spawn headline and the spawn `why` state the same plan, so all read it from
 *        here — one home for the plan's words, and for its count agreement: a legal
 *        `--warmer 1x,15m` reads `1 poke`, never `1 pokes`
 */
export const asWarmerPlanDense = (plan: {
  pokes: number;
  everyMinutes: number;
}): string =>
  `${asCountedNoun({ count: plan.pokes, one: 'poke', many: 'pokes' })}, ${plan.everyMinutes}m apart`;
