# F26 — the route-driver suites stub the review contract, and the contract's own suites do not

- **rework** = clean on the disputed half · dirty on the residual
- **status** = OPEN
- **confidence** = 95% on the dispute · 70% on the deferral of the creds-absent case

## .the fork, stated fairly

`rule.require.external-contract-integration-tests` is a blocker rule: every external contract crossed
by a change owes at least one test that calls the **real** service. the `mech-external-contracts`
lane read six files of this diff — four `driver.route.*.acceptance.test.ts` suites and two
`*.integration.test.ts` files — found `.test/mock-review.sh` in every one, and graded the contract
uncovered.

the fork:

| | the option | what it costs |
|---|---|---|
| **A** | concede — make the six cited suites call the real brain | ~6 min of real LLM per suite run, and it destroys the determinism those suites exist to hold |
| **B** | concede — add a real-brain case to one of the six | a second real-LLM case beside a corpus that already holds one |
| ✅ **C** | **dispute** the claim as raised, and defer the one residual it does correctly imply | the residual stays live until a council rules |

## .taken, and why at the time

**C.** the lane's claim — *"no real-service integration test exists in the target"* — is false, and the
rule's own text is what makes the dispute rather than a judgment call:

> *"even then, at least one real integration test must exist **somewhere**"*

**somewhere**, not *in the files the lane happened to read*. and it exists, twice over:

| the artifact | what it does |
|---|---|
| `src/domain.operations/route/guard/review/getReviewCountsViaBrain.caseBrain.deepseek-v4-flash.integration.test.ts` | its own docblock: *"boundary tests for the probabilistic tactic against the **REAL** deepseek-v4-flash brain … per `rule.forbid.integration.mocks` the tests hit the real model (no mocks)"*. it validates the response shape (`detected=true ∧ blockers >= 1`), and it sits **inside this diff's own subsystem** — `route/guard/review/` |
| `blackbox/review.by.guard-peer.acceptance.test.ts` | its own docblock: *"a full guard run drives a **real LLM review** as its peer … the guard execs `rhx review.by`, which runs a real review subprocess (~1 min)"*. it is the **guard seam** — the exact seam the lane says is only ever stubbed |

⇒ and the six suites the lane cites stub **deliberately and correctly**: their subject is the guard's
**orchestration** — the ladder, the budget, the absorb gate, the tally — never the brain. a test of a
retry loop stubs the network for the same reason, and `rule.forbid.integration.mocks` names that
exact case: a documented, reasoned stub with a real test beside it.

## 🔴 .the residual the lane does correctly imply, stated rather than buried

the rule's last clause is *"with atleast the lack of creds failure case"*. the corpus covers a
**brain-not-found** failure — `brain: 'nonexistent/broken/brain'` at
`blackbox/review.by.guard-peer.acceptance.test.ts:433` and `blackbox/review.by.acceptance.test.ts:821`,
each of which asserts that `brain not found: nonexistent/broken/brain` reaches the artifact as a
`💥 malfunction` rather than a fake `0/0`. it does **not** cover a **credential-absent** failure.

⇒ that is a real gap, and it is **not** what the blocker says. the blocker says the contract has no
real coverage at all.

## .rework, and why

**dirty, on the residual.** creds reach the brain through keyrack —
`genTestBrainContext.ts:60`, `creds: { keyrack: { owner: 'ehmpath', env: 'test' } }` — so a
creds-absent case is not an env-var unset. it needs either a keyrack stub or a real keyrack lock, in
a subsystem this round never opened, and the second risks a lock on the credential every other gate
in the run depends on.

**clean, on the disputed half.** no code moves; the coverage already exists.

## 🔴 .confidence, and why it is not 100%

**95% on the dispute.** the 5%: a council could read *"somewhere"* narrowly — as *"somewhere in the
diff"* — and the two citations above are both **outside** the six files the lane read, though one is
inside the diff's own directory. ⇒ if the council takes the narrow read, the answer is option **B**,
and it is one `given` block.

**70% on the deferral.** the creds-absent case is a rule clause left unmet, and the verification
stone's zero-tolerance line does not care whose subsystem it lives in. 🔴 **this is the round's third
collision with that clause** — `F22` and `F25` were the first two, and the index now says so.

## .where

- `.dream/v2026_09_23.fix.no-test-proves-a-creds-absent-brain-fails-loud.md` — the residual, with the
  shape of the fix
- `.behavior/…/.reviews/peer/5.3.verification._.review.i003.….r003._.taken.by_self.mech-external-contracts.md`
  — the `[REFUTE]`, with the counts

## .the verdict, once ruled

_pending._
