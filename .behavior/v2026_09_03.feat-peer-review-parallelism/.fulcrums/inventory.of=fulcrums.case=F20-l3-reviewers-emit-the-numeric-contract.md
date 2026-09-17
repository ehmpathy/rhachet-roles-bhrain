# F20 — the l3 reviewers emit the numeric contract, to route past a broken tally fallback

- **rework**: clean
- **status**: 🔴 **CONFIRMED at i024** — the fix works; both l3 lanes readable, 0 blockers
- **confidence**: 97%

## .the fork

both l3 peer reviewers (`enroll-impl-behavior-intent`, `enroll-impl-arch-defects`) are hand-authored
`rhx enroll claude` prompts that produce **prose**. a prose reviewer forces the guard into its
sub-brain tally fallback (`getReviewCountsViaBrain`), and that fallback is **systematically broken**:
it enrolls its tally clone deaf, then hands it the prose over stdin the deaf clone cannot receive, so
it malfunctions 100% of the time (reproduced i022 + i023, identical stderr — the reproduction is what
disproved the i022 *"transient"* read).

three ways out:

| option | why not taken |
|---|---|
| **A — overrule** (`--as overruled`) | human-only, and it buries a clean review under a false malfunction; a lever, not a fix |
| **B — fix the root fallback** | the deaf-clone defect lives in `ehmpathy/rhachet`'s clone-enroll mechanism, out of this repo's scope — caught as a reseed dream |
| **C — l3 reviewers emit the numeric contract** ✅ | the taken |

## .the pick, and why at the time

**option C.** the route is unsealed, so the `.guard` is a driver lever
(`rule.always.spend-own-levers-before-escalation`). I appended the `contract.reviewer-output`
numeric requirement to both l3 prompts: each now closes with the two lines the **deterministic**
parser reads (`N blockers` / `N nitpicks`), so the broken fallback is never reached. this is exactly
what the contract already demands of every reviewer — `rhx review` (the l1 lanes) conforms via
`genReviewOutputStdout`; the hand-authored l3 prompts simply had not been told to.

## .why it is clean

the `.guard` is not in the hashed artifact set (`getCacheSafePeerReviewArtifact.ts:19-22`), so the
edit moves no artifact hash: the 9 l1 lanes stay cached-approved and only the 2 l3 lanes re-run. the
edit is one appended sentence per prompt, reversible without a teardown, and it changes **how the
verdict is read**, never **what the reviewer decides**. both prose reads are already clean (r010:
*"solid and well-clamped"*; r011: no new architectural defect that blocks), so a readable verdict
approves.

## .the root, deferred

the systemic repair — the tally fallback must enrol its clone not-deaf or deliver the prose over
`-p` rather than stdin — is carried as a reseed dream to `ehmpathy/rhachet`:
`.dream/v2026_09_14.fix.prose-tally-fallback-enrolls-a-deaf-clone-and-always-malfunctions.md`. it is
not this repo's to make.

## .the outcome, measured at i024

the re-arrive at i024 ran both l3 lanes with the numeric-contract prompt. **neither malfunctioned —
both emitted readable verdicts:**

| lane | verdict | blockers | nitpicks | duration |
|---|---|---|---|---|
| r11 enroll-impl-arch-defects | **approved** | 0 | 3 | 767.4s |
| r10 enroll-impl-behavior-intent | rejected (on its own nitpicks) | **0** | 10 | 554.1s |

⇒ the deterministic parser read both. **the deaf-clone fallback was never reached.** the fix is
confirmed, and both l3 lanes raise **zero blockers** — the directive's *"converge till 3l approves"*
is met in the blocker sense.

## .the verdict, once ruled

_(open — the mechanism is proven; the council need only ratify the numeric-contract prompt as it
stands, or elect to fix the root fallback in `ehmpathy/rhachet` and revert the prompt edit)_
