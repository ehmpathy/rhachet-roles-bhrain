/**
 * .what = decides if the caller is a human at a keyboard, from TTY status
 * .why = the ONE actor check in this repo. it gates `--as approved`, `--as overruled`,
 *        `--as forced`, and `route.mutate grant allow` — every lever whose help text claims
 *        *"human only"*. a claim with no check behind it is a claim, never a gate.
 *
 * 🔴 .the probe is a TTY, and it is the repo's own paved idiom.
 *    `require_human()` ships in four shell files across two role trees and probes `[[ ! -t 0 ]]`,
 *    exit 2. this is that test in TS: a human at a terminal has a TTY; a clone that spawns a
 *    subprocess through a tool harness has a pipe.
 *
 * ⚠️ .it is WEAK, and that is stated rather than hidden.
 *    a bot in a terminal defeats it, and a human with stdin redirected is refused by it. the
 *    honest claim is *detectable, weakly* — never *undetectable*, and never *proven*.
 *
 * 🔴 .a second gate is MEANT to sit in series with it, and today that gate is REPO-LOCAL.
 *    the second is a deny entry on the driver's permission list, which refuses the command before
 *    the process starts. where both hold, a bot must defeat each, and the pair is the argument
 *    that carries.
 *
 * ⚠️ .but the deny entry landed in this worktree's `.claude/settings.json` — a local override that
 *    no other repo inherits. so the pair holds HERE and the FLEET has one gate: a clone in a repo
 *    with no such entry is held by the TTY probe alone, which the block above grades weak.
 *    ⇒ the shipped default is a single weak gate, and the docblock says so rather than claim a
 *    series it does not have (raised i001/r007 n3 + r008 n1; caught as a dream at
 *    `.dream/v2026_09_18.fix.the-actor-checks-second-gate-is-repo-local-so-only-this-worktree-holds-it.md`).
 *
 * 🔴 .there is NO env hatch, deliberately.
 *    the shipped shell idiom carries `__I_AM_HUMAN=true` so integration tests may mutate — and
 *    that is *a bot that passes its own human flag*, in an env var rather than a CLI flag, which
 *    `rule.forbid.self-grant-human-gates` forbids outright. a test that needs the privilege
 *    writes the flag file directly, which is setup through internals and sanctioned
 *    (`rule.require.acceptance.blackbox`).
 *
 * 🔴 .the input accepts `undefined`, and the comparison is `=== true` rather than a truthiness
 *    test. node leaves `isTTY` ABSENT on a non-tty stream, so `process.stdin.isTTY` is
 *    `undefined` rather than `false` for the commonest non-human caller there is. the two forms
 *    agree on every case a developer tries by hand, so the undefined row is pinned by a clamp.
 */
export const getDecisionIsCallerHuman = (input: {
  /** `process.stdin.isTTY` / `process.stdout.isTTY` — absent where the stream is not a tty */
  isTTY: boolean | undefined;
}): { isHuman: boolean } => {
  return { isHuman: input.isTTY === true };
};
