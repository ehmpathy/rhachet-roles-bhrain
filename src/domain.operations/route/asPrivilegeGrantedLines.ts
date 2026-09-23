/**
 * .what = the confirmation a HUMAN reads when a privilege grant lands, as tree rows
 * .why = the twin of `asPrivilegeRefusalLines`, and it exists for the same reason: this owns the
 *        tree's shape — the `├─`/`└─` connectors, the blank rows at each end — so it does not sit
 *        between the write and the caller (`rule.prefer.decomposable-architecture`).
 *
 * 🔴 .the SHARPER reason, and it is a test-coverage one.
 *    an inline render is a render no test can produce, so the positive output variant of
 *    `rhx route.mutate grant allow` could carry no snapshot at all — which
 *    `rule.require.contract-snapshot-exhaustiveness` forbids by name.
 *
 * 🔴 .it is a PURE builder, so the i/o stays at the boundary that owns it — as its refusal twin.
 *    the caller writes these to stdout, because a grant is a success and exits 0.
 */
export const asPrivilegeGrantedLines = (input: { route: string }): string[] => [
  ``,
  `🦉 privilege granted`,
  ``,
  `🗿 route.mutate grant allow`,
  `   ├─ route = ${input.route}`,
  `   └─ flag = .route/.privilege.mutate.flag created`,
  ``,
  `✨ route mutation now allowed until revoked`,
  ``,
];
