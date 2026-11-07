# F6 — the absent-credential case is the review brain's boot, already clamped

## .the fork

peer lane `mech-external-contracts` (5.3 i001, blocker.2) asks for a live case that runs the
provider with no credential and pins the error, for the poke and the review this diff changed.

- **A, taken.** dispute. the poke and the review reach the provider through one boot,
  `genReviewBrain`, and that boot's absent-credential refusal is already clamped end to end:
  `src/contract/cli/reviewBrainRefusal.acceptance.test.ts` `[case1]` spawns the real cli with
  `OPENROUTER_API_KEY` emptied and asserts exit 2, a `✋ ConstraintError:` header, the keyrack fix
  `rhx keyrack unlock --owner ehmpath --env prep`, no stack, and no review spent. this diff changes
  what the prompt holds, never how the brain boots or authenticates.
- **B.** add a second absent-key case inside `setOnePrefixPoke.integration.test.ts`. it would
  re-prove the same boot from a lower grain, and a poke never boots a brain of its own: it is
  handed the review's `context.brain`, so a poke with no key is unreachable — the boot refuses
  first.

## .why A

the rule's floor (at least one real integration test with the lack-of-creds case) is met for the
one external contract here, at the grain a driver meets it. B would add a test of a path the
runtime cannot reach.

## .rework

clean. if the council rules B, one `when` in `setOnePrefixPoke.integration.test.ts` with an emptied
key, which asserts the refusal `genReviewBrain` throws.

## .confidence — 85%, and why not higher

the clamp lives outside this diff, so the reviewer could not see it; a reviewer that weighs
"visible in the diff" as the bar would still want B.

## .verdict

open — for the director at the end of the route.
