import { REMINDER_NUDGE_PROSE } from './REMINDER_NUDGE_PROSE';

/**
 * .what = snapshot of the exact prose a RouteReminder injects into a driver session
 * .why = this string IS the human-faced payload — the "what the human sees" the friction rule
 *        demands a reviewer be able to eyeball. it is also the vision U1 must-validate lever, so
 *        any drift in the text is a deliberate, review-visible change, never silent
 *        (rule.forbid.friction-hazards snapshot coverage).
 */
describe('REMINDER_NUDGE_PROSE', () => {
  test('the injected nudge text is stable and review-visible', () => {
    // semantic assertions: the nudge must read as a prompt to ACT (drive on), not chatter —
    // the U1 must-validate intent. paired with the snapshot so sense + exact bytes are pinned.
    expect(REMINDER_NUDGE_PROSE).toContain('drive on');
    expect(REMINDER_NUDGE_PROSE).toContain('converge');
    expect(REMINDER_NUDGE_PROSE).toMatchSnapshot();
  });
});
