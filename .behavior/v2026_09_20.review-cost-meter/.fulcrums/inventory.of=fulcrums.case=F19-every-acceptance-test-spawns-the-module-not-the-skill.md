# F19 — every acceptance test spawns the module, not the skill

| | |
|---|---|
| **rework** | 🔴 **dirty** — the repair turns ~20 stdout snapshots red against a defect in a DEPENDENCY, so the suite cannot land green until `ehmpathy/rhachet` ships a fix |
| **status** | OPEN — best-guessed *keep the module spawn, clamp the gap, seed the cause* |
| **confidence** | 🔴 **65%** |
| **raised** | 5.3.verification, self review 6/8, by the byhand `jq` walk |

## .the fork

`reviewCost.acceptance.test.ts` reaches the cli by its **package subpath**, then `node -e`s an
import of that module. a human reaches it by `rhx review._.cost`. between those two sits the
rhachet runner — which prints a banner to **stdout** before every skill.

⇒ so the suite's 131 tests, the json-purity clamp written in this same stone among them, grade an
entrypoint **no human uses**, and the real one is broken:

```
$ rhx review._.cost --of tree --json | jq '.tokens'
parse error: Invalid numeric literal at line 2, column 5
```

> **does an acceptance test spawn the PUBLISHED entrypoint, or the module behind it?**

### taken — keep the module spawn, and clamp the gap by name

three reasons, in weight order:

1. 🔴 **the repair cannot land green.** point `runCli` at `rhx` and every stdout snapshot gains
   three lines of banner. the suite goes red against a defect in `node_modules/rhachet` that this
   branch has no authority to fix. a red suite handed to peers is worse than a named gap.
2. **the module spawn is not accidental** — it exists so the spawn `cwd` can be a fixture root
   rather than this repo, which is what makes every `--at` and default-cwd case expressible.
3. **the cause is seeded where it belongs** —
   `.dream/v2026_09_23.fix.rhx-prints-its-skill-banner-to-stdout-so-no-json-pipes.md`, a `reseed`
   dream owned by `ehmpathy/rhachet`, which carries the one-line diff and its blast radius.

### the road not taken — spawn `rhx`, and pin the banner into the snapshots

honest, and it makes the suite grade what a human meets. but it **bakes a dependency's defect into
20 committed snapshots**, so the day rhachet is fixed, 20 files go red for a good reason that reads
exactly like a regression. ⇒ a snapshot is a claim about our own contract; a banner from a
dependency is not ours to claim.

### 🔴 the road not taken — a second suite at the `rhx` grain

a small suite that spawns `rhx` and asserts only what the runner controls. **this is probably
right**, and it is not done here for one reason: today it would be a suite of `.skip`s or a suite
that pins a bug, because the behavior it wants to assert does not work yet.

⇒ **it is the natural first act once the dream lands**, and that order is an argument for the guess
rather than against it.

## .why it was best-guessed rather than halted

`rule.always.defer-fulcrums-to-last`, and a **dirty** rework is exactly why this earns a row
instead of a silent call (`rule.always.fix-forward-under-scouts-honor`: a dirt deferral owes a
fulcrum beside its dream).

🟡 **the confidence is 65%, and the doubt is not about the diagnosis.** the diagnosis is measured —
`invokeRun.js:54` is `console.log`, line 161 is `console.error`, and the pipe fails at every
breadth. the doubt is whether *"keep the module spawn"* is the right **disposition**, or whether a
branch that ships a `--json` flag owes a walk of that flag through the published entrypoint before
it claims the flag works.

## 🔴 .the transferable half — it is the R9 lesson, one layer out

R9 found a four-minute silent wait that 17 green assertions never saw, because they graded the
report's *contents* rather than what the human met. **this is the same shape at the entrypoint**:

> a test grades the artifact it was pointed at. a runthrough grades the artifact a human meets.
> **the entrypoint a test spawns is part of what it clamps** — and one that reaches past the
> published surface has quietly narrowed its own scope, with no word to the reader.

⇒ that is a candidate rule for `ehmpathy/role=mechanic`, beside `rule.require.acceptance.blackbox`,
which today says *"test via the contract"* and does not say *"via the contract's own entrypoint."*

## .where it lives

- `src/contract/cli/reviewCost.acceptance.test.ts` — `CLI_MODULE_URL` / `CLI_COMMAND` / `runCli`
- `src/domain.roles/reviewer/skills/review._.cost.sh` — the published entrypoint, a clean `exec`
- `node_modules/rhachet/dist/contract/cli/invokeRun.js:53-55` — the banner, on stdout
- `.dream/v2026_09_23.fix.rhx-prints-its-skill-banner-to-stdout-so-no-json-pipes.md` — the cause
- `$route/5.3.verification.yield.md` → R10 — the stone's record of the find
