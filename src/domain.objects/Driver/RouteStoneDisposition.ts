/**
 * .what = whether a stone's route drives itself forward, or has halted and needs a human
 * .why = the single disposition both the onStop hook (push → block the stop, halt → allow the
 *        stop) and the statusline glyph (push → calm, halt → 👋/✋/💥) read, so the pinned
 *        emoji and the autonomous-drive behavior can never disagree
 *
 * .note = 'push' = the route self-drives (the agent can act now, or no block stands).
 *         'halt' = the route stopped and a human is needed; `why` names which help:
 *         - 'approval'    → a human must approve (👋)
 *         - 'exhausted'   → peer budget spent; a human must approve or extend (👋)
 *         - 'blocked'     → a driver wall (--as blocked); a human must clear it (✋)
 *         - 'malfunction' → a reviewer/judge broke; a human must fix it (💥)
 */
export type RouteStoneDisposition =
  | { of: 'push' }
  | {
      of: 'halt';
      why: 'approval' | 'exhausted' | 'blocked' | 'malfunction';
    };
