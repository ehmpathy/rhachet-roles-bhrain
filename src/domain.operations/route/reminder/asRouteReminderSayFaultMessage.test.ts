import { asRouteReminderSayFaultMessage } from './asRouteReminderSayFaultMessage';

/**
 * .what = unit cases for asRouteReminderSayFaultMessage
 * .why = the thrown fault headline is the text a human/operator reads when the inject boundary
 *        breaks. it must name the concrete fault + remedy, and it must not drift silently — so
 *        each case snapshots the exact message (rule.forbid.friction-hazards snapshot coverage;
 *        rule.require.errors-name-the-fix). deterministic, decoupled from the live execFile.
 */
const TEST_CASES: {
  description: string;
  given: { code: number | string | null; killed: boolean };
  // a token the headline MUST carry — proves it names the concrete fault, not just bytes
  expectContains: string;
}[] = [
  {
    description: 'rhx absent on PATH (ENOENT) → names install/PATH remedy',
    given: { code: 'ENOENT', killed: false },
    expectContains: 'PATH',
  },
  {
    description:
      'timeout kills the child (killed) → names the wedge + duration',
    given: { code: null, killed: true },
    expectContains: 'timed out',
  },
  {
    description:
      'unexpected non-2 exit code → names the exit + points at stderr',
    given: { code: 7, killed: false },
    expectContains: 'exit 7',
  },
];

describe('asRouteReminderSayFaultMessage', () => {
  TEST_CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      const message = asRouteReminderSayFaultMessage({
        code: thisCase.given.code,
        killed: thisCase.given.killed,
        timeoutMs: 30000,
      });
      // semantic assertion: the headline names the concrete fault + remedy (not just bytes)
      expect(message).toContain(thisCase.expectContains);
      expect(message).toMatchSnapshot();
    });
  });
});
