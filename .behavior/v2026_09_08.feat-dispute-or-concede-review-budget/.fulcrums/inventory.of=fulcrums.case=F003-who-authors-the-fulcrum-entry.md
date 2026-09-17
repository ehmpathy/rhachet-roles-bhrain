# F03 · who authors the fulcrum entry — the command, or the driver?

- **rework** = clean · **confidence** = 88% · **status** = 🔴 **WISHER-RULED — upheld, then REVERSED
  by `S05`, both on 2026-09-09**
- **filed as** `…case=F003-dispute-mints-the-fulcrum.md`, renamed once the call it named was reversed
  — 🟡 **a `case=` slug names the QUESTION, never the verdict.** a slug that states a verdict is a
  second copy of the status field, and the two drift the moment a council rules

🔴 **the taken fork is: the DRIVER authors it; `--as disputed --why <path>` points at it.**

🔴 **the guess was upheld and then inverted within one session.** the body below is the argument as
it stood; **read the two verdicts at the foot, in order** — the second amends the first, and the
first is kept because *what a wisher was asked* is evidence about what a design assumed.

## .the fork

acceptance #4: *"a `<dispute>` is itemized as a fulcrum … a dispute that leaves no fulcrum row is
the failure mode this whole change turns on."*

| option | how the row gets there |
|---|---|
| **A** | the command **writes** the entry + appends the summary row, from `--why @stdin` |
| **B** | the command **checks** a row exists and refuses if absent |
| **C** | the rule says to write one; no code reads `.fulcrums/` |

## .taken, and why

**option A.**

`rule.prefer.prevent-over-correct` names a ladder and says to reach for the highest rung the case
allows:

| rung | the shape here |
|---|---|
| 1 · make it impossible | ✅ **A** — a dispute cannot exist without its row, because one call writes both |
| 3 · catch it early | B — a real gate, and it still admits an empty row |
| 4 · report it well | C — the status quo, and the failure mode the wish names |

⇒ **A is rung 1 and B is rung 3**, so the ladder forces A.

🔴 **and it delivers a dream open since 2026-08-31.**
`.dream/v2026_08_31.entool.a-fulcrum-entry-has-no-template.md` asks for exactly this:

> **rung 2 → rung 3, if it earns it:** a `route.fulcrum.set` operation that findserts both files —
> computes the next ordinal from `Glob`, writes the entry from the six fields, and appends the
> summary row in one call. **that closes the census gap by construction rather than by discipline.**

⇒ the dispute command **is** that operation, reached from a different wish. **no code reads
`.fulcrums/` today** (verified: one grep hit, in a test comment). this would be the first.

## .the shape

```
rhx route.stone.set --stone 5.1 --as disputed --with architect --why @stdin
```

`--why @stdin` per `rule.require.explicit-stdin-flags`. the command fills what it can compute — the
ordinal, the slug, `where`, the review hash, the reviewer, the blocker count — and takes from the
driver only the irreducible judgment: **the fork, and why**.

⚠️ **the hash it fills is PROVENANCE, and the mint is the one place that could be misread as a
key.** the command writes the hash *and* files the stance, in one act, so a builder reads the two as
one record. they are not: the stance keys to the slug's **latest given**
(`getLatestPeerGivensPerSlug.ts:44-50`, *"across all hashes"*), exactly as the debt does. ⇒ **the
hash is written for the council to recompute against; it is never read back by the engine.**

🔴 **this whole paragraph is MOOT under `S05`, and its residual is the opposite of what it warned
about.** the command writes no hash, because it writes no entry — **a driver-authored fulcrum cannot
record a hash the driver does not compute.** ⇒ so the misread it guarded against is unreachable, and
what replaces it is a **loss**: the stance's provenance is now the `.given` path rather than a hash,
which is derivable and is the truer referent, but gives a council no artifact-set fingerprint at all.
⚠️ that loss is small precisely because `F04`'s verdict made the fingerprint near-useless — one bit
over `src/**/*`. **two reversals cancelled, and neither was aimed at the other.**

## .rework, and why

**clean.** to fall back to B is to delete the write half and keep the check. the file shape is the
extant inventory contract, so no reader changes.

## .confidence, and why it is 88%

high — the ladder settles it, and an open dream asks for it. the 12%: **the mint may over-reach the
wish's scope.** acceptance #4 asks that a dispute *be itemized*; it does not ask for a fulcrum tool.
a reviewer could read the mint as scope creep.

⇒ **what would settle it:** the wisher confirms the mint is welcome, or asks for B and leaves the
entoolment to the dream that already tracks it.

## .where

`1.vision.experience.case=1.the-disagreement-that-drives-on.md` `[t2]` · `case=7`

## ✅ .the verdict — option A, ruled 2026-09-09

> i really like this;   3. F03 @ 88% — is the fulcrum mint welcome?

⇒ **the mint is welcome. the command WRITES the entry.** the 12% doubt this entry carried —
*"the mint may over-reach the wish's scope"* — is retired. the seed is
`.seeds/inventory.of=seeds.case=S01-the-fulcrum-mint-is-welcome.md`.

⚠️ **what the verdict does NOT settle:** whether the mint is extracted as a `route.fulcrum.set`
operation and booted for other roles. that is the `boot.yml` scope call at triage question **C5**,
and it stays with the dream that tracks it. **this behavior mints for the driver; the dream is
advanced, never closed.**

🔴 **`S05` then settled C5 the other way, and by removal.** with no mint there is no operation to
extract, so the scope call has no subject here — and the wisher filed the tool itself as a dream:
*"maybe that fulcrum inventory skill should just be a dream for now"*
(`.dream/v2026_09_09.entool.a-fulcrum-inventory-has-no-operation.md`). ⇒ **the dream is neither
advanced nor closed by this behavior; it is now the sole owner of the work.**

### 🔴 the MINT inverts to a REQUIRE — `S05`, 2026-09-09

> *"but the `--as disputed --why $path` shoould reference fulcrums"*
> *"each fulcrum is a single dispute; and they can reuse fulcrums from past disputes"*

**the driver AUTHORS the entry. the command takes a PATH to it, and refuses if it does not resolve.**

```sh
rhx route.stone.set --stone <stone> --as disputed --with <slug> \
  --why .fulcrums/inventory.of=fulcrums.case=F00N-<slug>.md
```

| the clause | fate |
|---|---|
| *"the command WRITES the entry"* | 🔴 **inverted** — it **requires** one, and stores the reference |
| 🔴 *"acceptance #4 is structurally impossible to violate"* | ✅ **survives, by a different mechanism** — no resolvable fulcrum, no dispute |
| *"rung 1 of `prevent-over-correct`"* | ✅ survives — a path that must resolve is still a constraint, never a check-after |
| *"the command fills the ordinal, the slug, `where`, the hash"* | 🔴 **gone.** the driver hand-names the file, which is the friction `.dream/v2026_09_09.entool.a-fulcrum-inventory-has-no-operation.md` fixes |

⚠️ **this amends option A rather than restores option B.** B was *"the command CHECKS that you wrote
one"* — a check the driver could satisfy with an empty file. **a path that must resolve to an entry
is stronger than B and weaker than A's authorship**, and it is what the wisher asked for.

### 🔴 and the findsert question it once carried is RETIRED

this section previously best-guessed a **findsert on `(stone, reviewer)`** at 75%, to answer *"a lane
is re-disputed on each artifact move — one entry, or N?"*

⇒ **there is no key, so there is no findsert.** the driver passes a path:

- **the same argument still holds** → they pass the **same path**. that is the reuse, and the wisher
  named it outright
- **a new point is disputed** → they author a new entry and pass **its** path
- ⇒ *"one row per lane vs one per declaration"* is **the driver's call, per declaration**, over a
  rule inside a mint

🔴 **and one fulcrum is ONE dispute, with N permitted per reviewer:** *"they can open multiple
disputes w/ multiple fulcrums for the same reviewer if they want too."* so the relation is
many-to-one — a lane may carry several live disputes at once.
