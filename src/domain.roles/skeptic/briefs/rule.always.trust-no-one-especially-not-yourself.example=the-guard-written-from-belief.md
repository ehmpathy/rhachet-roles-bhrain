# rule.always.trust-no-one-especially-not-yourself.example=the-guard-written-from-belief

> 2026-11-18, nheuron. a belief about `grepsafe`, held by a director seat, became a guard in `goal.tree`. the belief was stale. the guard outlived it.

## .the shape, in any life

a parent sees a child fall once from a tree and bans all climbs. years on, the child is tall and sure, and the rule still stands. what belief is this rule made of, and when did I last test it?

the case below: a guard was written from a belief about a tool, and it refused the very run that would have tested it.

## .the record

the header of `goal.tree.done-blind-grepsafe.integration.test.ts` reads:

> `.agent/repo=.this` is a link into the shared main checkout, outside a worktree root. grepsafe exits 2 ("search path must be within the git repository") on it … (2026-11-12: a director logged a false "the fix is not landed" from one)

the seed of the guard is a director's own miss: a `--done` check ran `grepsafe` over a role path, read a refusal (or an empty result), and logged "the fix is not landed". the cure written that day was a guard that refuses the check.

## .the hubris

| step | the belief | the read that would have tested it |
|---|---|---|
| the miss | "grepsafe cannot read a role link" | run the same call, read its exit code and its `matches:` line |
| the cure | "refuse any done-check that names such a path" | run the refused shapes against the live tool |
| the clamp | a suite that asserts the refusal text | a suite that runs the tool the text describes |
| 2026-11-18 | the text still says "exits 2" | one run of `rhx grepsafe --path .agent/repo=.this/role=pioneer/briefs`: exit 0 |

the cure was written from the belief, so it carries the belief. a guard is the strongest form of a belief: it refuses the seat that tries to test it.

## .the cost

a guard that refuses a correct check, and a suite that pins the refusal as correct. each later seat that met it had two texts that agreed with each other and disagreed with the tool.

## .the lesson, by law

- the first suspect for a stale guard is the seat that wrote it, since the author read the belief as true and no later seat has a reason to re-read it
- a cure for a miss of a tool owes a read of the tool, in the same turn the cure is written
- a clamp that asserts the text of a refusal pins a belief; a clamp that runs the tool pins a fact

up: `rule.always.trust-no-one-especially-not-yourself`
