# a fixture that models an impossible shape hides the defect it should catch

## .what

when a test fixture describes a state the product cannot actually produce, it stops serving as
evidence. worse: production code that reads the real world correctly looks *broken* against it,
so the pressure runs backward — toward a guard that bends the code to fit the fixture.

## .why

a fixture is a claim about reality. break that claim and every test built on it inherits the
break silently: the assertions still pass, so the suite reads green, while the shape under test
never occurs in production and the shape that DOES occur is never exercised.

the tell is a guard whose stated reason names a test artifact. the moment a production docblock
cites "a passage-only fixture" or "a route mid-scaffold" as the reason for a branch, the fixture
has begun to drive the design.

## .the shape

1. a fixture seeds a partial state (one file, not the set a real route carries)
2. some consumer reads that partial state and answers honestly — "this is done"
3. the fixture MEANT "in progress", so the honest answer looks wrong
4. a guard is added to make the honest answer match the fixture
5. that guard is now live in production, where the partial state is REAL and the guard is wrong

step 4 is the whole defect. it converts a fixture gap into a product behavior.

## .the worked example

`genRouteWithPassage` seeded a route's `passage.jsonl` and no `.stone` files. so every fixture
described a route that holds a passage entry for `5.1.execution` yet holds no
`5.1.execution.stone` — a shape the product cannot make.

the stone frontier decides completion. `stepRouteDrive`, the authority, answers on the frontier
alone: `nextStones.length === 0 → route complete! 🌴🤙`. so a route with no enumerable stones is
COMPLETE by its own rule — which means every "active drive" fixture in truth supplied a complete
one.

`getRouteDriveComplete` read completion honestly and therefore disagreed with those fixtures. the
resolution taken was a guard — `stones.length > 0 && nextStones.length === 0` — documented with
"a passage-only fixture … is indeterminate". green suite, shipped defect:

- the drive answered "complete, stop"
- the reminder answered "active, nudge on"
- so the daemon nudged a session whose every drive replied `complete` — forever

the wish forbade exactly that (no infiniloops), and the door existed and was tested — just gated
behind a bit that a real completed route can flip.

the fix ran the other way: seed a `.stone` per named stone so fixtures model real routes, add an
explicit `stonesOpen` for the genuine mid-route pause (a `passed` tail AND an open stone — two
distinct states that share one status), and let the product read completion by ONE rule. 17 tests
went red on that change; each was a fixture that had claimed an impossible shape.

## .the checks

- does a production guard's stated reason name a *fixture*, a *scaffold*, or a *test* shape?
  → suspect it drives the design; ask what the real-world shape is
- does the fixture seed every artifact a real instance carries, or only the one under test?
  → a partial seed is fine only where the absence is itself the case under test, said explicitly
- do two consumers of one snapshot answer the same question differently?
  → one of them is bent; find which authority owns the question and align to it
- when a fix turns many tests red, read each before you soften the fix
  → a wide red is often the fixtures that confess, not the fix that overreached

## .the pair

`rule.require.clamp-edge-cases` says prove the clamp bites. it also applies in reverse: if a
clamp for the REAL shape breaks many tests, that breakage is the measure of how far the fixtures
had drifted. fix the fixtures, keep the clamp.

## .see also

- `rule.require.hermetic-tests` (mechanic) — a fixture must stand on its own, and stand for a real state
- `work.flow/diagnose/rule.require.clamp-edge-cases` (mechanic) — clamp the class, prove it bites
- `rule.require.trust-but-verify` (mechanic) — a green suite is a claim, not a proof
