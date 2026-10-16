import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = what a warmer should do when it wakes
 * .why = the three outcomes are exhaustive, and each is a different act
 */
export type WarmerWakeVerdict =
  | { act: 'poke'; why: string }
  | { act: 'defer'; why: string; waitMinutes: number }
  | { act: 'retire'; why: string };

/**
 * .what = decides whether a woken warmer pokes, defers, or retires
 * .why = a warmer's schedule is a chain of touches, never a fixed clock, and a
 *        real review is a touch. the naive schedule pokes every `everyMinutes`
 *        from spawn, but a driver who re-drives the guard 2 minutes before a poke
 *        has already warmed that replica: the review fills the cache on the read
 *        path exactly as a poke does, so the poke that follows buys naught and
 *        bills in full — a redundant warm, and the likeliest kind, since a driver
 *        re-drives when they are active and the warmer is too. so the wake asks
 *        `sinceTouch`, never `sinceSpawn`, and defers to `lastTouch +
 *        everyMinutes` whenever a review beat it to the punch.
 *
 * .note = gaps are measured from the last touch of either kind, since residency does not care
 *         which kind of read refreshed it.
 *
 * .note = `attemptsSpent` counts from the last nominal review, never process
 *         start. a deferral spends no money and protects no bytes, so only a
 *         real poke advances the counter — a tally of deferrals would retire a
 *         warmer that never poked at all.
 */
export const getOneWarmerWakeVerdict = (input: {
  /** minutes since the prefix was last touched — by a review OR a poke */
  sinceTouchMinutes: number;
  /** how many pokes this warmer has already sent since the last nominal review */
  attemptsSpent: number;
  /** the plan this warmer runs */
  plan: { pokes: number; everyMinutes: number };
}): WarmerWakeVerdict => {
  // the budget is spent — the warmer exits rather than polls for a round that
  // may never come. its total spend is bounded by a figure declared up front
  if (input.attemptsSpent >= input.plan.pokes)
    return {
      act: 'retire',
      why: `spent its ${asCountedNoun({ count: input.plan.pokes, one: 'poke', many: 'pokes' })} since the last review`,
    };

  // a review (or a prior poke) touched the prefix more recently than the
  // cadence, so a poke now would be redundant. defer to keep the chain at
  // exactly `everyMinutes` from the last touch of any kind.
  //
  // the wait is clamped to one cadence. a touch stamped ahead of this clock (a
  // run-dir stamp from a skewed writer) reads as a negative elapsed time, and
  // an unclamped wait would aim past a full cadence — later than any touch
  // could justify, and likelier to land past the cache ttl
  if (input.sinceTouchMinutes < input.plan.everyMinutes) {
    const waitMinutes =
      input.plan.everyMinutes - Math.max(0, input.sinceTouchMinutes);
    // the why states the skew rather than a negative age, which a reader of the
    // warmer's log would blame on the meter rather than the clock
    const sinceTouchWords =
      input.sinceTouchMinutes < 0
        ? 'touched ahead of this clock (a skewed stamp)'
        : `touched ${Math.round(input.sinceTouchMinutes)}m ago`;
    return {
      act: 'defer',
      why: `${sinceTouchWords}, under the ${input.plan.everyMinutes}m cadence`,
      waitMinutes,
    };
  }

  return {
    act: 'poke',
    why: `${Math.round(input.sinceTouchMinutes)}m since the last touch`,
  };
};
