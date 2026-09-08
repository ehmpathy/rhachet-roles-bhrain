# domain.term.choice.reason: unreadable

## .etymology

**unreadable** — "cannot be read". the word is chosen because it names the failure from the
**guard's** side, which is precisely where the consequence lives.

the guard is a reader. it looks at a reviewer's stdout for two numeric counts. when it cannot find
them, the honest report is not *"the reviewer is broken"* — the guard cannot know that — it is
*"I could not read a verdict here."* the reviewer may have run perfectly and simply spoken prose.

⇒ that distinction is the whole reason the word exists rather than an extant one. **`unreadable`
describes what the guard experienced; every rejected alternative describes what the reviewer
allegedly did, which the guard is in no position to assert.**

## 🔴 .how it parts from `malfunction`

these are the closest neighbours in the vocabulary and they are NOT the same concept:

| | `malfunction` | `unreadable` |
|---|---|---|
| what it grades | the **process** — it could not run | the **output** — it ran, and said no number |
| how it is detected | an exit code that is neither `0` nor `2` | exit `0`, plus no numeric count in stdout |
| who forgives it | a human `--as overruled` only | the driver, with a `.taken` |
| does it deadlock? | it blocks passage until overruled | no — it is answerable |

⇒ a reviewer that exits `0` and prints an essay **did not malfunction**. it ran, it finished
cleanly, and it produced text the guard cannot score. to call that a malfunction would overload a
declared term (`rule.forbid.domain-term-ambiguity`) and would route the driver to a human overrule
when a `.taken` would serve.

## .the rejected alternatives

| word | why it was rejected |
|---|---|
| `unparseable` | machine jargon, and it over-claims — it implies a grammar the output violated. there is no grammar; there is a regex for a number, and prose simply has none |
| `invalid` | asserts the reviewer did something wrong. often it did not — a reviewer may legitimately speak prose and rely on the sub-brain tally, which is a supported path |
| `malformed` | same over-claim as `invalid`, plus it suggests corruption. the output may be perfectly well-formed english |
| `empty` / `blank` | 🔴 **factually wrong in the common case.** the output is usually full of text; what is absent is a *number*. a driver who reads `empty` opens the given expecting a bare file and finds a page of prose |
| `uncounted` | reads as a state that could still be resolved by counting, which invites *"then count it"* — but the point is that no count exists to find |

## .evidence

- **the contract it enforces**: `contract.reviewer-output` — *"if it finds no numeric count it can
  NOT assume zero. a silent 0/0 would look like a clean approval when in truth no verdict was
  seen."* the adjective exists to carry that rule to the surface
- **the vision was WRONG about this, and the correction is the evidence.** `1.vision.yield.md`
  argued an undetected verdict scores `blockers: 0`, so a malfunctioned reviewer could never mint
  a debt. `mech-failhides` caught it at 5.1: the shipped engine does the opposite, and gates. the
  term names the state that correction created
- **the fabricated count**: `asPeerGivenVerdict.ts` scores `blockers: 1` for an unreadable given.
  the render must therefore NOT print `1 blocker`, or the failhide is merely relocated from the
  gate to the driver's screen
- **the orthogonality**: `retired` and `unreadable` are independent axes, clamped together by
  `formatRouteGuardReviewPeerContemplatePrompt.test.ts [case6]`, the stacked render

## .disputes

none raised on the word. r2 asked at i011 for the CLI-grain snapshot of this variant, which is a
coverage ask rather than a term dispute (r1 nitpick.1, raised at i006 · i007 · i010 · i011).
