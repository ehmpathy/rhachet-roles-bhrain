# F12 — `brain:` bounds the driver clone, never the reviewers the same guard declares

**rework** = clean · **status** = 🔴 **RULED — driver-only, as best-guessed** · **confidence** = n/a, settled

> ✅ **the wisher upheld the best-guess.** verbatim: *"only the driver"*. archived at
> `.seeds/inventory.of=seeds.case=S2-the-fulcrum-council-settles-three.md`.
>
> ⇒ the record of the verdict, and the one question it does NOT close, are at the foot of this file.

> raised at self-review r1 (`has-experience-coverage`), after a read of an extant guard showed the
> file **already** declares brains — one per peer reviewer.

## .the fork, stated fairly

a guard already carries brain declarations today:

```yaml
# src/domain.operations/route/.test/assets/route.peer.budget/1.vision.guard
reviews:
  peer:
    - slug: primo
      run: rhx review --rules ... --brain opus
    - slug: cheapo
      run: rhx review --rules ... --brain sonnet
    - slug: cheap2
      run: rhx review --rules ... --brain haiku
```

add a top-level `brain:` and one file holds **four** brain declarations at two scopes. so the fork
is: **what does the top-level key govern?**

- **driver-only** — the clone the hook addresses. the `--brain` flags are untouched
- **stone-wide default** — the driver, plus any reviewer that names no brain of its own
- **stone-wide override** — the driver and every reviewer, `--brain` flags ignored

## .taken, and why at the time

**driver-only.**

1. **the apply mechanism has no other reach.** the hook's lever is `clone say` into the driver's
   pty. a reviewer is a `run:` subprocess with its own flag; to govern it would need a second,
   unrelated mechanism — a rewrite of the `run:` line before it executes
2. **it matches the extant precedent exactly.** `--brain` on a `run:` line already means *"the brain
   of the clone this line spawns"*. the top-level key means the same for the clone the guard
   governs. one sense, two sites
3. **the wide reads invert the feature's own cost claim.** a rich driver would silently buy rich
   reviews — three of them, on every round, forever. that is `case=7`'s leak, sideways and larger

## .the counter-case, stated fairly

⚠️ **a wisher may genuinely want one lever for the whole stone.** *"this stone is hard, so every part
of it runs rich"* is a coherent and useful ask, and driver-only cannot express it — it would need
four edits where one would do.

⇒ and the guard file itself argues for the wide read: **every other brain declaration in it applies
to a subprocess**, so a reader has no structural reason to expect the top-level one is narrower. the
name does not carry the scope, which is exactly why the scope must be documented rather than inferred.

## .rework, and why

**clean.** it is a documented bound plus the branch the hook does not take. no caller is hardened
against it, no artifact records a reviewer's brain, and no later stone builds upon it.

⚠️ it is clean **only until downstream templates stamp a value**. once bhuild's guard templates carry
`brain:` beside `reviews:`, a scope change re-prices every route that adopted them — the same
clean-until-adopted shape as `F10`.

## .confidence, and why 85%

the **mechanism** argument is decisive and measured: the hook has no reach into a `run:` subprocess,
so driver-only is the only read the proposed apply sequence can actually deliver. that is a fact
about the design, not a preference.

the open 15% is that the wisher may want the wide read enough to ask for the second mechanism. that
is a scope call and it is theirs.

🟡 **whatever they pick, the ambiguity itself is the defect** — three defensible reads of one key,
and the guard reads identically under all three. the fulcrum is which read; the blocker is that the
vision did not state one.

## .where

`1.vision.experience.case=9.the-guard-already-declares-brains.md` — the demoed critipath ·
`1.vision.experience.case=_.md` slice 1 and slice 4, `other-known`.

## 🔴 .the verdict — RULED 2026-09-10: driver-only

> *"only the driver"* — the wisher, verbatim (`S2`)

### what the verdict settles, as a concept

> **a declaration governs the actor it names.** `brain:` names the driver's brain. a reviewer already
> carries its own `--brain` on its own `run:` line, and one key does not reach across two scopes.

⇒ the wide reads are refused, and with them the leak they carried: a rich driver never silently buys
three rich reviews on every round.

### 🔴 what the verdict does NOT close — and this file said so before the council

the 15% held open was *"the wisher may want the wide read enough to ask for the second mechanism."*
**that is answered for this route and it is not answered forever** — a wisher who later wants *"this
whole stone runs rich"* wants a second feature, and driver-only cannot express it.

⚠️ it is named as a **cost of the design**, never reserved as a fulcrum. the same treatment the yield
gives the per-drive override: a scope addition nobody asked for is stated so a reader learns it
before the blueprint stone rather than after.

### 🟡 the defect the ruling actually retires

**the ambiguity, not the read.** three defensible reads of one key, and the guard file rendered
identically under all three — that was the blocker; which read wins was only the fulcrum.

⇒ so the blueprint stone owes the **documented bound** regardless: the key's scope must be stated
where a guard author reads, because — as this file argued — *"the name does not carry the scope."* a
ruled scope that is not written down leaves the guard reading exactly as ambiguous as before.
