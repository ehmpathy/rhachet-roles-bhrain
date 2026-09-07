# gap: `flake` — one word across two concepts

**state** = open · **kind** = overload · **measured** 2026-08-31, in this repo, twice in one release

## .the two concepts under one word

| the cause | random? | ours? | what `flake` implies you do |
|---|---|---|---|
| genuine nondeterminism — a race, an order dependence | yes | yes | **retry**, and it may pass |
| a **degraded upstream** — a provider that refuses, then hangs | ❌ no | ❌ no | retry ⇒ a coin flip on someone else's weather |

⇒ the two are indistinguishable at the moment of the read, and only the first is the concept `flake`
names. the second is a `constraint` whose owner sits outside the repo — not a flake that happens to
be slow, but a separate concept under a borrowed word.

## .the cost is a misrouted diagnosis, never a misnamed file

- *"it is flake"* closes the investigation and prescribes a retry
- 🟡 *"the upstream is degraded"* **opens** a different one
  - is the job timeout too tight?
  - is there a fallback brain?
  - should a preflight name it?

**the word chosen decides which question gets asked**, which is the harm
`rule.forbid.domain-term-ambiguity` names: the overload hides an absent distinction.

## .the repair, and why it is not paved

a **second word for the upstream case**, then a cluster for each — never a widened `flake`.

⇒ two instances from one repo on one day is too thin a sample for
`rule.require.enumerate-before-you-name` to bite. the word waits on a third.

## .the adjacent term that is settled, and under watch

🟡 `malfunction` is **not** a gap; its implementation is a defect.

| the artifact | what it says |
|---|---|
| `term=route.guard.review.malfunction` | *a process that rendered no verdict at all* |
| `getExitCodeClass.ts` | grades an overflowed reviewer `constraint` |

⇒ the code and the glossary disagree today. the repair is caught at
`.dream/v2026_08_31.fix.overflowed-lane-grades-constraint-not-malfunction.md`.

## .see also

- `.behavior/v2026_08_12.feat-adopt-seeded-briefs/refs/diagnosis.cicd-release-2026-08-31.md` — the
  two measured instances
- `rule.always.diagnose-reviewer-malfunctions` (driver) — where the binary *"flake rather than
  defect"* is offered, and where the third cause fits neither
- `.readme.md` — the census row this file backs
