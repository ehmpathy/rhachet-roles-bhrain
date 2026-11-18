import { asClaudeSettingsShapeFault } from './asClaudeSettingsShapeFault';
import type { ClaudeSettingsOfRepo } from './ClaudeSettingsOfRepo';

/**
 * .what = whether a parsed json value has the settings shape every toggle verb walks
 * .why = json that parses can still hold a shape the walk cannot read (`"Stop": "x"`, a block
 *        whose `hooks` is a string); a read over it would crash mid-verb, and a write over it
 *        would replace a file the toggle does not understand. so the shape is checked whole,
 *        once, before any verb reads it
 *
 * .note = one walk decides both the guard and the refusal's `found =` leaf
 *         (`asClaudeSettingsShapeFault`), so the two can never disagree
 */
export const isClaudeSettingsOfRepo = (
  value: unknown,
): value is ClaudeSettingsOfRepo =>
  asClaudeSettingsShapeFault({ value }) === null;
