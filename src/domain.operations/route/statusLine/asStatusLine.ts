import type { RouteStoneDisposition } from '@src/domain.objects/Driver/RouteStoneDisposition';

/**
 * .what = where inside a stone the work is: the guard phase, as a status-line suffix
 * .why = names each part of a stone's progress (yield → review.self → review.peer → judge)
 *        so the renderer can pair it with the disposition's attention emoji
 *
 * .note = phase is pure context — WHERE the work is. it never carries "stopped"; that is the
 *         orthogonal `RouteStoneDisposition` (push | halt). the two compose at render time.
 */
export type StatusLinePhase =
  | { of: 'yield' }
  | { of: 'review.self'; done: number; total: number }
  | { of: 'review.peer'; level: number; rounds: number }
  | { of: 'judge' };

/**
 * .what = renders the route's status-line state into the claude code status line string
 * .why = single source of truth for the moai-prefixed status line format
 *
 * .note = the moai stone-head 🗿 is the driver's own icon (the driver navigates stones; a moai
 *         is a stone head). render states:
 *         - blank                       → '' (unbound, or a route with no stones)
 *         - stone + phase + disposition → '🗿 <stone>, <phase>[, <halt-word>] <emoji>'
 *         - stone, phase null           → '🗿 <stone>' (plain: phase could not be derived — the
 *           degrade target when phase derivation faults, so the base line never regresses)
 *         - complete                    → '🗿 route complete 🌴🤙'
 *
 * .note = the final emoji is an attention signal read by color, and it derives from the
 *         DISPOSITION, not the phase: push is calm (🌾 yield / 🔍 review·judge); halt is an
 *         ask (👋 approve or extend, ✋ a driver wall, 💥 a malfunction). so the pinned emoji
 *         says exactly what the onStop hook does — self-drive, or stop for a human.
 */
export const asStatusLine = (
  input:
    | { kind: 'blank' }
    | {
        kind: 'stone';
        stone: string;
        phase: StatusLinePhase | null;
        disposition: RouteStoneDisposition;
      }
    | { kind: 'complete' },
): string => {
  // a bound route whose stones all passed → done, hang loose (close it out or rewind)
  if (input.kind === 'complete') return '🗿 route complete 🌴🤙';

  // a current stone → the moai prefix + the stone name + its phase/disposition suffix
  if (input.kind === 'stone') {
    // phase could not be derived → the plain stone line (base feature never regresses)
    if (!input.phase) return `🗿 ${input.stone}`;

    const suffix = asPhaseSuffix({
      phase: input.phase,
      disposition: input.disposition,
    });
    return `🗿 ${input.stone}, ${suffix}`;
  }

  // blank → empty so the harness renders an absent line
  return '';
};

/**
 * .what = builds the suffix "<phase-text>[, <halt-word>] <emoji>" from phase + disposition
 * .why = phase gives the words (WHERE the work is); disposition gives the emoji (WHETHER it
 *        self-drives) and, when halted, the halt-word that names why — one uniform shape
 */
const asPhaseSuffix = (input: {
  phase: StatusLinePhase;
  disposition: RouteStoneDisposition;
}): string => {
  const text = asPhaseText(input.phase);

  // push → the route self-drives; tip the phase with its calm glyph, no halt-word
  if (input.disposition.of === 'push')
    return `${text} ${asCalmGlyph(input.phase)}`;

  // halt → the route stopped; append the halt-word + its attention glyph
  const halt = asHaltParts(input.disposition.why);
  return `${text}, ${halt.word} ${halt.emoji}`;
};

/**
 * .what = the phase text — WHERE the work is, with no attention marker
 * .why = the words half of the suffix; the emoji half comes from the disposition
 *
 * .note = the peer round is zero-padded to 3 (`i002`) so the token width is stable across
 *         rounds; the level is not padded (`l3`), per the wish's `l3@i002`.
 */
const asPhaseText = (phase: StatusLinePhase): string => {
  if (phase.of === 'yield') return 'yield';
  if (phase.of === 'review.self')
    return `review.self, r${phase.done}/r${phase.total}`;
  if (phase.of === 'review.peer')
    return `review.peer, l${phase.level}@i${asPaddedRounds(phase.rounds)}`;
  return 'judge';
};

/**
 * .what = the calm glyph for a push phase — the route self-drives, no attention needed
 * .why = a push needs no one; yield grows (🌾), a review or judge is the machine's (🔍)
 */
const asCalmGlyph = (phase: StatusLinePhase): string =>
  phase.of === 'yield' ? '🌾' : '🔍';

/**
 * .what = the halt-word + attention glyph for a halted disposition
 * .why = a halt tells the human HOW to help: 👋 to approve or extend, ✋ to clear a wall,
 *        💥 to fix a malfunction — the color triages the urgency
 */
const asHaltParts = (
  why: 'approval' | 'exhausted' | 'blocked' | 'malfunction',
): { word: string; emoji: string } => {
  if (why === 'approval') return { word: 'approved?', emoji: '👋' };
  if (why === 'exhausted') return { word: 'exhausted', emoji: '👋' };
  if (why === 'blocked') return { word: 'blocked', emoji: '✋' };
  return { word: 'malfunction', emoji: '💥' };
};

/**
 * .what = the fixed width a peer round count is zero-padded to (`i002`)
 * .why = names the literal so the pad reads as intent, not a magic value
 *        (rule.forbid.magic-values); the wish fixes this width at 3 (`l3@i002`)
 */
const PEER_ROUNDS_PAD_WIDTH = 3;

/**
 * .what = zero-pads a peer round count to a fixed width (2 → "002")
 * .why = names the pad so the peer render reads as narrative, and keeps the `i{rounds}`
 *        token a stable width for legibility
 */
const asPaddedRounds = (rounds: number): string =>
  String(rounds).padStart(PEER_ROUNDS_PAD_WIDTH, '0');
