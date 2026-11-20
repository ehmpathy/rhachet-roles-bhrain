import { asStoneGuardCounter } from '../guard/asStoneGuardCounter';

/**
 * .what = renders the hold a fulcrum names for one concern: `<reviewer>/i<NNN>/<concern>`
 * .why = the dispute refusal and the paste block both teach the hold to add; one render, so the
 *        driver pastes the round it actually read rather than an `<iteration>` placeholder
 *
 * .note = iteration is null only where no given is known; then the placeholder stands
 */
export const asFulcrumHoldOfConcern = (input: {
  reviewer: string;
  iteration: number | null;
  about: string;
}): string =>
  `${input.reviewer}/${
    input.iteration === null
      ? '<iteration>'
      : `i${asStoneGuardCounter({ value: input.iteration })}`
  }/${input.about}`;
