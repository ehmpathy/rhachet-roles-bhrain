# F19 — the live granted wire stays pty-unclamped, and the residual is recorded rather than closed

| field | value |
|---|---|
| `rework` | 🟢 **clean** — a later pty-backed case is additive; no extant assertion moves |
| `triage` | 🔴 **wisher** — a scope call, `F13`'s shape |
| `confidence` | 🟡 **76%** |
| `status` | best-guessed |
| `opened` | 2026-09-19, at `5.3.verification` i003 — raised by peer `ergo-acceptance-journey-coverage` nitpick.1 |

## .the call

> **`route.ts:1946` — `{ isTTY: process.stdin.isTTY === true }` — is driven by the REFUSAL cases and
> by no granted case, and that is where it stays in this behavior.**

the reviewer's remedy is *"a clamp on the cli read (or a pty-backed acceptance case as the dream
sketches)"*. neither is taken here.

## 🔴 .the exposure the concern names is already held — two of three regressions go RED

this is the half of the concern that does not hold, and it is a matter of arithmetic rather than
judgment. **a spawned skill has a pipe on stdin, so `process.stdin.isTTY` is `undefined`.**

| the regression the reviewer names | what a pipe then reads | caught? |
|---|---|---|
| *"a silent `context.isTTY = true`"* | `true` ⇒ **GRANTS** | ✅ `[case4][t1]` and `[case6]` phase 2a both go red |
| *"an inversion of the probe"* (`!== true`) | `undefined !== true` ⇒ **GRANTS** | ✅ both go red |
| a constant `false` — **not named by the reviewer** | `false` ⇒ refuses | 🔴 **ships green** |

⇒ **the concern's stated exposure — *"would ship green"* — is false for both cases it names.** the
two acceptance assertions that catch them are `result.grantResult.code === 2` and
`result.flagPresent === false`, and neither is incidental: both were added by this behavior and both
are now annotated as the live wire's clamp.

## .the residual, stated at its true width

**one regression is uncaught: the read replaced by a constant `false`.**

🟡 **and it fails CLOSED.** a human's grant stops to work, which is loud the first time one is
attempted — where the two the reviewer named fail **OPEN** and silently re-open the door this whole
behavior exists to shut.

## .the fork, stated fairly

| option | what it does | what it costs |
|---|---|---|
| **A — record the residual, name the three regressions** (taken) | the comment at `route.ts:1929-1943` and the acceptance case both carry the table above | one uncaught regression, and it fails closed |
| **B — a pty-backed acceptance case** | the granted wire is driven end to end | 🔴 `node-pty` is a native build and a CI risk; a host pty utility is a **bare host dep**, which `rule.forbid.bare-host-deps` forbids, with flags that diverge between linux and macOS |
| **C — a test escape on the read** (`NODE_ENV === 'test' ⇒ isTTY`) | every spawn reads as human, so a granted case is trivial | 🔴 **refused at i002/r002 and the refusal stands.** it would make every acceptance spawn a human and weaken the gate this behavior exists to build |
| **D — extract the read to a leaf** | the line moves | 🔴 it buys naught. the extracted leaf's own caller is then the undriven line |

## 🔴 .why option D is the one worth a council's glance

it is the option that **looks** like a close and is not. `process.stdin.isTTY` must be read
somewhere, and wherever it is read is a line a spawn cannot vary. ⇒ **the residual is a property of
the process boundary, never of where the read sits in the call graph** — which is why the reviewer's
first remedy (*"a clamp on the cli read"*) has no implementation that does not reduce to B or C.

⚠️ and `routeMutateGrant` calls `process.exit`, so it cannot be driven in-process at any grain.

## ⚠️ .why it is not 93%

the reviewer's **rule** citation is exact and it binds: *"do NOT settle for a snapshot only at an
injected or mocked layer and call the live journey covered."* the granted render is pinned at the
injected layer alone, which is precisely the shape that clause forbids.

⇒ **the defect is real; what is disputed is its size and its price.** a council may fairly rule that
a gate this behavior exists to build earns a native dependency, and the rework is clean either way —
a pty case is purely additive.

🟡 **and this row does not claim the dream discharges it.** `rule.always.catch-dreams-for-followups`
is explicit that a dream is the second-best outcome and a safe, clean fix is the best. option B is
**clean** and is **not safe** (a native build in CI), which is the one row of the SAFE/CLEAN table
that earns a deferral.

## .what would move it

- a council that rules the granted wire earns a pty → **option B**, and `node-pty` enters the corpus
- a council that rules a closed-failure residual is acceptable where the open-failure ones are held
  → **option A ratified**, and the annotations are the whole of what is owed
- a pty-free way to vary `isTTY` across a process boundary → the fork dissolves, as `F15` did

## .see also

`F13` — the scope-call shape this shares ·
`.dream/v2026_09_18.fix.the-actor-checks-granted-path-is-simulated-so-one-wire-is-unproven.md` — the
residual's record, narrowed by this round · `rule.forbid.bare-host-deps` — what option B's cheaper
half violates · the peer given `…r004._.given.by_peer.ergo-acceptance-journey-coverage` nitpick.1
