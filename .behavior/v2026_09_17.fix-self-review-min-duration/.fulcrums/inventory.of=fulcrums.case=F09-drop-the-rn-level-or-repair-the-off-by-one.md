# fulcrum F09 — drop the `rN` level, or repair the off-by-one

**rework** clean · **status** ✅ **RESOLVED — A, and keyed on the PROMISE slug** (`S12`) ·
**confidence** 97% · **where**
`getSelfReviewArticulationPath.ts:11`, `findNextUnpromisedReview.ts:25`, `setStoneAsPassed.ts:256`,
`stepRouteStoneSet.ts:315-331`

## .the measured defect, first — there IS a diff, and it spans THREE call sites

| call site | what it passes as `index` |
|---|---|
| `findNextUnpromisedReview.ts:25` — the shared source | `selfReviews.indexOf(nextUnpromised)` — **zero-based** |
| `setStoneAsPassed.ts:256` — the challenge emit | `nextIndex + 1` — **one-based position** |
| `stepRouteStoneSet.ts:315-331` — the `--as promised` success emit | `promisedCount` — **a count, not a position** |

one quantity, three derivations. so one owed review is printed at two different levels by the two
commands a driver actually reads.

🔴 **the drive suffered this TWICE on this stone, then PREDICTED it a third time.**

| # | what happened |
|---|---|
| 1 | wrote `has-experience-coverage` to `for.1.vision._.r1.…`; the guard owed `r2` |
| 2 | 🔴 the success emit handed out `for.1.vision._.`**`r2`**`.has-questioned-requirements.md`; the drive wrote exactly there; the gate refused with *"the articulation is absent"* and named **`r3`** |
| 3 | 🔴 **predicted before it fired.** after 4 promised, the success emit printed **`r4`**; the drive computed the gate's owed level from `setStoneAsPassed.ts:256` as `nextIndex + 1` = **`r5`**, minted the trigger, and the gate printed `r5`. **the divergence is deterministic and derivable from source** |

**instance 2 is the sharpest evidence of the harm**: one slug, one session, four minutes apart,
**both values printed by the guard itself, and they do not agree.** the drive obeyed the first emit
and was refused by the second — which is `c8′` exactly, with the guard as the cause and no move the
driver could have made to avoid it.

🔴 **instance 3 is the sharpest evidence of the CLASS**, and it is a different kind of claim.
instances 1 and 2 show a driver got burned; instance 3 shows the burn is **computable in advance** —
the two emits diverge by exactly one, always, because `promisedCount` and `nextIndex + 1` are two
names for two different quantities. ⇒ so this is not a flaky off-by-one that fires under some
condition. **it fires on every review after the first, by construction**, and the only reason a
driver ever lands on the right path is that they read the *second* emit rather than the first.

⇒ that puts this fulcrum in the same class as `c8′`: **the guard printed a level it does not
check.** two independent instances of one invariant — *the path the guard prints equals the path
the guard checks* — found in one round, on two separate fields.

## .the fork, stated fairly

`S08` and `S09` name two repairs, and the wisher offered them as alternatives.

| | **A — drop the level** (`S08`) | **B — repair the off-by-one** (`S09`) |
|---|---|---|
| the path | `for.$stone._.$slug.md` | `for.$stone._.r$index.$slug.md`, unchanged |
| the change | one operation's signature; every call site drops an argument | 🔴 **three call sites reconciled**, and held in agreement forever |
| what it retires | 🔴 **the class** — the off-by-one, the level pitfall, and the *"guess the level"* cell all become unreachable | **the instance** — the emits agree until the next one is written; the level still cannot be computed by a driver |
| the key it lands on | `(stone, slug)` — **the promise's own key**, already hashless | `(stone, slug, index)` — a third key in a two-key subsystem |
| extant articulations | 🔴 every `for.*._.r*.*.md` on disk is at a path the new code does not compute | untouched |
| snapshots | every route snapshot that renders an articulation path | the emits that print an index |
| against the round's thesis | ✅ **the same move** — the round's whole claim is that a derived component in a key is the defect | ⚠️ orthogonal; leaves the derived component in place |

## 🔴 .the asymmetry that decides it

the level is **assigned by the guard and typed by the driver**. that is the whole defect class, and
B does not touch it: after B, a driver still reads an ordinal off a screen and re-types it, and a
future emit that computes it differently re-opens the same wound.

⇒ and A is **not a redesign**. it removes an input; it adds none. the path stays a computed string
the guard prints and the driver copies — with one fewer thing that can disagree.

⚠️ **what A costs, stated rather than waved past:** the level carried information — *which round of
review this is* — and A drops it from the filename. the drive judges that information is already in
the **promise ledger** and in git, so the filename is not its only home. **a council that disagrees
should rule B.**

## .taken, and why at the time

**A — drop the level**, at 85%.

it is the round's own thesis applied one level down: a key that carries a derived component invites
several parties to derive it differently, and the repair is to remove the component rather than to
reconcile the derivations. `S08` says exactly this, and `S09` reads as the wisher's fallback rather
than their preference — *"or just fix it"*.

🔴 **the confidence rose from 70% to 85% mid-round, and the reason is measured rather than argued.**
the first draft assumed **two** derivations, which made B — *"just fix it if there's a diff"* — the
cheap option: one `+ 1`, one side. instance 2 above revealed a **third**, at a call site the drive had
not read, and it is the one the driver reads most.

⇒ so B is not one `+ 1`. it is **three call sites that must agree forever**, across two commands and
a shared source, and this session is the proof that they do not. A removes the quantity, and an
absent quantity cannot be derived wrong.

⚠️ **the reason confidence is 85% and not higher**: `S09` is a real instruction from the wisher, and
a council may prefer B on **scope** grounds — a one-line repair inside a wish that has already grown
to three subjects — which is a judgment about this round rather than about the defect.

## .the rework

**clean**, on the code. one operation's signature and its call sites; no caller outside this repo
takes the path as input.

🟡 **not clean on the artifacts already on disk.** every extant `for.*._.r*.*.md` sits at a path A
no longer computes. ⇒ so A owes a migration decision the council should rule with it:

- **leave them** — they are per-route records of passed stones, and no code re-reads them
- **or `mvsafe` them** — a rename per file, with no citation to repair, since they are cited by the
  promise ledger rather than by path

the drive's read is **leave them**: a passed stone's articulation is never re-checked, so a rename
buys tidiness and no correctness.

## .the verdict

✅ **ruled: A** — *"yep, do it based on the promise slug instead"* (`S12`). the level leaves the
path; the articulation keys on `(stone, slug)`.

⇒ the question was: **is the ordinal the problem, or is this ordinal wrong?** the answer is the
ordinal.

### 🔴 .the answer named the KEY, which the fork did not

the fork asked *drop the ordinal, or reconcile its three derivations*. the verdict answers a third
question beside it — **what the path keys on instead** — and names the **promise slug**.

that is a refinement, not a restatement: option A as written removed a component and left the
replacement key implicit. ⇒ **the articulation and the promise now provably share one key**, so:

- a driver who can name the promise can **compute** the articulation path, with no emit to copy
- the two artifacts cannot drift, because there is one key rather than two
- `c8′`'s level member is **unreachable** rather than repaired

🟡 **and it lightens `--into` considerably** (`F03`): a path computable from `(stone, slug)` alone
strips the flag of most of its purpose, which is why this fulcrum was ruled first.

### 🟡 .the migration, still owed

the drive's read stands and is **not** settled by `S12`: every extant `for.*._.r*.*.md` sits at a
path the new code does not compute. **leave them** — a passed stone's articulation is never
re-checked, so a rename buys tidiness and no correctness. ⇒ recorded here so a reviewer grades the
absence of a migration as deliberate.
