import type { StoneBrainOutcome } from './setStoneBrain';

/**
 * .what = the brain slug that prices this stone, or null where none does
 * .why = the drive's `where do we go?` bucket (route, stone, brain) needs ONE string;
 *        narrowed once, so every drive surface reads the same fact
 *
 * .note = `inherited` yields its slug as `requested` does: the bucket answers "what is
 *         live?", never "who set it"
 * .note = `undispatched` yields its slug too — no claim the switch landed (the halt beside
 *         it says it did not), but the brain the guard asked for, which a fix needs
 */
export const asStoneBrainSlug = (input: {
  outcome: StoneBrainOutcome;
}): string | null =>
  input.outcome.outcome === 'none' ? null : input.outcome.brain;
