# F16 · the budget write is an unlocked read-modify-write, and the gate makes a lost grant cost more

- **rework** = 🟢 clean, and outside this behavior's surface · **confidence** = 🟡 **72%** ·
  **status** = best-guessed · **triage** = 🔴 `[wisher]` — a scope call, same shape as `F13`

## .why this row exists at all

**the vision walked six axes and carried five.** `r1` peer review raised the sixth against
`rule.require.dimensional-decomposition`'s own list of usual omissions — *"concurrency, actor =
system, resource-absent states"* — and the walk had enumerated states and never an order of arrival.

## .the constraint, read from source

```ts
// processGuardFileBudgets — route.ts:2116-2131
for (const guardPath of input.guardPaths) {
  const content = await fs.readFile(guardPath, 'utf-8');                // :2117
  const result = updateGuardPeerBudgets({ content, addAmount, … });
  if (result.modified) await fs.writeFile(guardPath, result.content);   // :2127
}
```

| the property | verified |
|---|---|
| a lock, lease, or lockfile | 🔴 absent |
| an atomic rename | 🔴 absent — a direct `fs.writeFile` |
| a compare-and-swap | 🔴 absent |
| the write unit | 🔴 **the whole guard file**, never the one `budget:` line |

⇒ two grants that name **different peers** still write the **same file**, so they collide without
ever naming the same field.

## 🔴 .the direction the peer review proposed, and why the source refuses it

the concern read *"two top-ups in parallel can both observe B = urgent / quota = 1 and both write —
one granted quota that funds two grants."*

| direction | reachable by an overlap? |
|---|---|
| **more** budget than asked | 🔴 **no.** each writer recomputes `budget + N` from its own read; the later write carries a total that never saw the earlier. two `--add 4` yield **+4** |
| a grant with **no warrant** | 🔴 **no.** the gate ran independently per caller |
| 🔴 **less** budget than REPORTED | ✅ **yes** — a lost update, printed as success |

⇒ **the bound is safe under every order of arrival.** the hazard is the inverse of the one raised,
and it is a `rule.forbid.failhide` shape rather than a bypass.

## .the fork

| option | the shape | the cost |
|---|---|---|
| A | make the guard write **atomic** — write-tmp-then-rename, or a lockfile | a real change to `processGuardFileBudgets`, a surface this behavior does not otherwise open |
| B | **re-read and retry** on a content mismatch | the same surface, plus a retry policy to design |
| 🔴 C | **record the axis, demo it, close it not** | zero code; the vision carries a verdicted slab and a named residual |
| D | fail loud instead — verify the write landed, and exit non-zero if it did not | narrower than A, and still the same surface |

## .taken, and why

🔴 **option C**, with the axis walked and `case=12` written.

1. **`rule.always.fix-forward-under-scouts-honor`'s two questions both answer no.** SAFE? the write
   path is shared by every guard-field mutation, not merely budget. CLEAN? it lands in
   `processGuardFileBudgets`, which this behavior reads and does not otherwise change
2. 🔴 **the bound — the wish's actual subject — is provably safe here.** `case=12` `[t5]`: no
   overlap can produce more budget than a serial run, and none can produce a grant with no warrant.
   ⇒ this is an **extant failhide**, never a hole this design opens
3. **it is the same call `F13` takes, for the same reason**, and a route that defers one extant
   defect and repairs another on identical grounds would be inconsistent

⚠️ **the honest counterweight: this design RAISES the price of the defect.** before the gate, a lost
grant costs a re-run. after it, a lost grant **spends a warrant** that is not refunded — and under
`F10` the warrant may already have been the only one on the stone. so the deferral is defensible and
not free.

## .rework, and why

🟢 **clean, and outside this behavior's surface entirely.** the repair is one operation's write
strategy; no caller is hardened against it, and the reversal is a diff to a single function. ⇒ a
council may rule A or D at any later stone without a teardown.

## .confidence, and why it is 72%

| what is certain | what is not |
|---|---|
| ✅ the write is unlocked — read from `:2117` and `:2127` | 🔴 whether two grants on one route ever genuinely overlap in practice |
| ✅ the bound cannot be loosened by an overlap — arithmetic on the read-modify-write | 🔴 whether a council reads *"the gate makes it cost more"* as enough to pull the fix in |
| ✅ the loss is printed as success — a failhide | 🟡 whether `F02`'s meter, if ruled in, needs an atomic decrement as a **hard** requirement |

🔴 **the 28%:** the reachability half is genuinely unmeasured. one driver per worktree is the
ordinary case, and a council may rule the overlap unreachable for the **guard file** and therefore
the whole row moot — which would leave `F02`'s meter as the only live half, since that file is
shared across routes by construction.

⇒ **what would settle it:** a wisher's call on whether an extant unlocked write becomes this
behavior's problem once the behavior makes its loss expensive.

## 🔴 .corroborated TWICE at i004, by two independent reviewers — and each supplied a different half

both i004 prose lanes reached this row without prompt, and **neither is a restatement of the other**:

| lane | what it added |
|---|---|
| r010 `enroll-impl-behavior-intent` | the **symptom a driver meets**, in words the row lacked |
| r011 `enroll-impl-arch-defects` | the **severity escalation**, stated more sharply than §69-72 had it |

**r010 — the driver's experience of the failhide.** the row described a lost update; r010 named what
it feels like at the keyboard:

> *"a friction hazard a driver would experience as 'I ran the grant command, it said success, and my
> round didn't fund' — a hard one to diagnose without knowing this exists."*

⇒ that clause is what makes this a `rule.forbid.failhide` item rather than a race note, and it is
what a council needs to price the deferral: **the driver cannot diagnose it**, so the cost is not one
re-run but an unbounded hunt.

**r011 — the price, sharper than §69-72 states it.** this row already carried *"a lost grant spends a
warrant that is not refunded."* r011 puts the before-and-after in one line:

> *"this behavior **raises the price** of the extant defect: a lost concurrent grant now silently
> burns a non-refundable urgent warrant rather than just costing a re-run."*

⇒ and r011 draws the consequence the row did not: it calls this *"the single largest residual
architectural risk on the stone"* and asks that it be settled **before `F02`'s meter work lands on
the same file** — since a meter decrement would share the identical unlocked path.

🟡 **so the 28% has narrowed on one of its two halves.** the row's uncertainty was *"whether a council
reads 'the gate makes it cost more' as enough to pull the fix in"*; two independent reviewers now
answer **yes, settle it** — though neither asked it be fixed **in this diff**, and both endorsed the
scope call. ⇒ the deferral stands; what changed is that the **ask for a verdict** is now third-party
rather than self-reported.

⚠️ the **reachability** half is untouched — no reviewer measured whether two grants on one route ever
genuinely overlap, and that remains the open question a council must weigh.

## .where

`route.ts:2116-2131` — the unlocked loop · `1.vision.experience.dimensions.md` §9 — the axis ·
`1.vision.experience.case=12` — the demo · `1.vision.experience.case=_.md` § *the off-slab
tabulation* — the `F = concurrent` slab · `F02` — the meter whose decrement shares the hazard ·
`F13` — the same deferral call, on the other extant defect ·
`.reviews/peer/…i004…r010._.taken.by_self.enroll-impl-behavior-intent.md` and
`…r011._.taken.by_self.enroll-impl-arch-defects.md` — the two corroborations

## .the verdict

_not yet ruled._
