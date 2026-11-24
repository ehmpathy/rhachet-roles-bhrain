# F6 — a thorough local run, or the ci gate, as the full-suite proof

## .the fork
stone 3.1 instructs `THOROUGH=true npm run test`, a local run of every suite. this repo's `rule.forbid.thorough-test-runs` forbids `--thorough` on `git.repo.test` and names the sharded ci run as the full-suite gate; a local run proves the branch scope only.
- **A.** obey the stone: a local thorough run on each tree
- **B.** obey the repo rule: a branch-scope local run, plus the ci run on the same commit as the full-suite proof

## .taken: B
- the repo rule is the narrower, local authority; the stone is a generic template from the mechanic's `declapract.upgrade` skill
- the ci run covers every suite the thorough run would, on the exact commit, with the strict keys this host lacks (acceptance cannot run here at all)
- a thorough local run did pass on the tree before the dependency swap (unit 676 suites, integration 263); the swap's tree is proven by ci run `45187393318` (46 checks pass) and the branch-scope runs

## .rework: clean
run `THOROUGH=true` locally once, cite it in the yield. no code changes.

## .confidence: 85%, why not higher
it acts against a literal stone instruction. the stone's motive (no suite left unrun) is met, but by ci rather than by this host.

## .where
stone `3.1.repair.test.defects`; `3.1.repair.test.defects.yield.md` status table; self review `has-all-tests-passed-dynamic`.

## .verdict
settled B, by the driver, under the director's grant to settle it.
- why a ci run on the same commit stands in: the ci `test` workflow runs every suite a local thorough run would (unit, integration, acceptance, every shard), on the exact commit the pr ships, with the strict keys this host lacks. a local thorough run proves less: it cannot reach acceptance here at all
- the proof on record: `test` run `45196464465` on head `73fa92f3`: 46 checks pass, 1 skipped (`github / apply`, a deploy job). it carries the new `audit.test.intentions` suite too
- the bound: this stands in only when the ci run and the local tree share one commit. a local edit not yet pushed has no ci proof, and owes a branch-scope local run before any claim
