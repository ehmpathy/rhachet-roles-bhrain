/**
 * .what = the prose nudge a RouteReminder injects into a driver session
 * .why = this payload is what makes the reminder a *Reminder* and not a scheduled command —
 *        a human-language poke the model interprets, not a deterministic dispatch. the wish
 *        supplies the words; they live in one place so the tick and any future adapter send
 *        the exact same string.
 *
 * .note = the payload text is a must-validate lever (vision U1): if this prose fails to
 *         reliably re-drive an idle session, the fallback is a deterministic `rhx route.drive`
 *         command. a warmer lead ("you can do it!") aims to read as a real prompt to act, not
 *         chatter.
 *
 * .note = the 🗿 (moai) prefix marks PROVENANCE: it tags the message as an automatic poke
 *         from the route's own RouteReminder, not a keystroke from the human. the driver reads
 *         the marker and knows the nudge arrived on a wall-clock tick, so an auto-poke is never
 *         mistaken for a human instruction (rule.require.status-feedback — the source is visible).
 *         the moai — a Polynesian stone head — echoes the route's own stone glyph, so the marker
 *         reads as "this came from a route stone".
 */
export const REMINDER_NUDGE_PROSE =
  '🗿 you can do it! drive on, fulcrum, and converge';
