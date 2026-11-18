/**
 * .what = renders the stdout of `rhx route.fulcrum.rule` once a verdict is written or found
 * .why = the human reads which case they ruled, how, when, and in which file — and what the
 *        verdict now asks of the driver. an upheld verdict sheds the concern; a conceded one owes
 *        a repair, so the two must never read alike. pure, so a unit snapshot pins the bytes the
 *        success path prints (the lever itself is human-only, so no acceptance test can reach it)
 */
export const asRouteFulcrumRuleStdout = (input: {
  outcome: 'ruled' | 'unchanged';
  case: string;
  ruled: 'upheld' | 'conceded';
  on: string;
  path: string;
}): string =>
  [
    input.outcome === 'ruled'
      ? '🦉 so it is. the verdict is written'
      : '🦉 so it was. this verdict already stands',
    '',
    '🗿 route.fulcrum.rule',
    `   ├─ case: ${input.case}`,
    `   ├─ ruled: ${input.ruled}`,
    `   ├─ on: ${input.on}`,
    `   ├─ file: ${input.path}`,
    input.ruled === 'upheld'
      ? `   └─ next: the dispute stands; its concerns stay shed from the tally`
      : `   └─ next: the driver repairs each held concern in the current diff, then runs rhx route.drive`,
  ].join('\n');
