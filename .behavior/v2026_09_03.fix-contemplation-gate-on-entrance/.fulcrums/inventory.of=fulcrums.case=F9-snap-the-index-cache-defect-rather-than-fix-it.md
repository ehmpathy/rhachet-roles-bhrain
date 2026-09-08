# fulcrum F9 — snap the index-keyed cache defect rather than fix it

- **rework** = clean
- **status** = ✅ **RULED 2026-09-08 — the deferral is REVERSED, via option D.** the wisher: *"lets do
  D and then leave a 'todo: fix structurally with A' which points to the dream of A."* the harm is
  closed at the read; the key stays wrong and a `todo` carries it. seed
  [S24](../.seeds/inventory.of=seeds.case=S24-close-the-harm-now-and-point-the-todo-at-the-structural-fix.md)
- **confidence** = ⚫ **moot — the call was made by the wisher.** it stood at 90%, after
  72% → 80% → 90%, both moves by measurement. ⚠️ **the number is kept as the record of what I
  believed, never as a live claim** — a ruled fulcrum has no confidence left to hold
- 🔴 **and the direction is the notable part: I scored the deferral 90% and the wisher reversed it.**
  every measurement I took was sound; each raised confidence in the *analysis* and none tested the
  *fork*. ⇒ **a confidence score measures how well you argued the options you listed.** option D was
  invisible on the page for four days and no amount of measurement would have surfaced it
- **where** = `src/contract/cli/routeStoneSetContemplation.acceptance.test.ts [case7] [t3]`
- **surfaced** = 5.3.verification, i009, by the case r10 blocker.2 asked for

## .the fork

the CLI-grain clamp for `case=11` (the retired reviewer) surfaced a defect that is **not this
behavior's**: the guard's review cache is keyed on the reviewer's **index**, while its meter is keyed
on the reviewer's **slug**. so a reviewer enrolled at a position a prior reviewer held inherits that
predecessor's verdict.

measured, in the snapshot this case now carries:

```
├─ r1: successor (l1, 0/5)
│   ├─ rejected, cached
│   ├─ 1 blocker 🔴
│   └─ given: …_.given.by_peer.departed.md
```

⇒ `successor` never ran, and is rendered rejected on `departed`'s critique.

three ways to leave the round:

| option | what it costs |
|---|---|
| **A — fix the key** | a slug field on the artifact, a writer change, a reader change with back-compat, and a stamp-format migration — inside the review cache this behavior already rekeys |
| **B — drop the case** | the reviewer's blocker.2 goes unanswered, and the defect stays invisible |
| 🔴 **C — snap it, label it a defect, catch a dream** | the journey is clamped, the defect is on record and red-on-fix, and the cache is untouched |

### 🔴 a FOURTH option existed and this table never listed it — added 2026-09-07

**D — guard the cache at the READ, and discard it on a slug mismatch.**

the fork was posed as *rekey the artifact, or leave it alone*, and that is what made A look
architect-scale and C look like the only cheap move. **it skipped the option that costs neither.**

| what D needs | is it available? |
|---|---|
| a slug on the cached artifact | ✅ **already there, via `path`** — `path` is the entity's `primary` key, and the filename carries the slug |
| a parser for it | ✅ **extant and tested** — `getRouteGuardReviewPeerPathMeta({ path })` returns `{ slug, iteration }` |
| a schema change | ❌ **none** |
| a stamp-format migration | ❌ **none** |

```ts
const cached = cachedReviews.find((r) => r.index === pr.index);
const cachedSlug = cached && getRouteGuardReviewPeerPathMeta({ path: cached.path }).slug;
const cacheSafe = cached && cachedSlug === pr.slug ? cached : null;   // discard on mismatch
```

⇒ **it fails safe by construction.** a discarded cache costs one re-run — a budget round, which is the
correct price for a lane whose rung changed. a *reused* wrong cache ships a false green.

🔴 **this undercuts the stated ground for the deferral, and only partly.** this entry's third test reads
*"clean? ⛔ no. the render IS the cache's storage format, so a new field is a migration."* **that is true
of A and false of D** — D adds no field and reads a key that already exists. ⇒ the honest position is
that **A is architect-scale and D is not**, and the entry never separated them.

⚠️ **D is not free, and one known defect is why.** the parser **throws** on an unparseable filename, and
`.dream/v2026_09_04.fix.unparseable-peer-filename-halts-the-gate.md` records that an unparseable name
already halts a gate elsewhere. to add a parse on the cache hot path is to add a new throw site ⇒ **D
must use a lenient read** (parse-or-null, and treat null as a mismatch, which fails safe in the same
direction). that is a real design point, not a footnote.

## ✅ .the verdict — D is TAKEN, 2026-09-08

the wisher ruled: **do D, and leave a `todo` that points at A's record.**

| what landed | where |
|---|---|
| the guard | `getCacheSafePeerReviewArtifact.ts` |
| the lenient parse it needs | `asPeerReviewSlugFromPath.ts` |
| the clamp | `getCacheSafePeerReviewArtifact.test.ts` — `[case2]` swap · `[case3]` insert · `[case5]` unreadable |
| the `todo` for A, with its pointer | the guard's docblock → `.dream/v2026_09_05.fix.guard-review-cache-is-keyed-by-index-not-slug.md` |

🔴 **all THREE position-keyed reads are guarded, not the one the sketch named.**

| # | where | what an unguarded read does there |
|---|---|---|
| 1 | the reuse fast-path, `runStoneGuardReviews` | the measured case — a false green or false red on the newcomer |
| 2 | `computeVerdicts`, same file | 🔴 **unlocks a level** on a verdict its current reviewer never gave |
| 3 | `getAllReviewPeerMeterStatuses` | 🔴 feeds `getStoneGuardLevelClearance` — the same unlock, second road |

⚠️ **this entry said *"both position-keyed reads"* until site 3 was found by a grep for the
expression.** site 3 sits three lines above a comment that **already argued the slug key** for the
fallback beneath it — so the argument was in place, on the page, above an unguarded index lookup, and
survived two prior passes over this defect.

⇒ **the count is the lesson, and this route had already recorded it twice** (i004 → i005, in
`5.1.execution.from_vision.yield.md`): *"the extraction is not the close — enumerate the sites."* a
wisher's sketch is a site list too, and it is the author's reach rather than a census.

✅ **the clamp was dogfooded, never assumed.** with the guard reverted to return the cache
unconditionally: **3 of 7 red** — the swap, the insert, and the unreadable-name case. restored: 7 green.

⚠️ **two departures from the wisher's sketch, both forced by facts the sketch could not carry:**

| the sketch | why it could not stand |
|---|---|
| `getRouteGuardReviewPeerPathMeta(...)` | it **throws** on an unreadable name — right for the contemplation gate, wrong on a hot path over engine-written files. a lenient twin returns `null`, and the caller reads `null` as a **mismatch** |
| `cachedSlug === pr.slug` | the filename carries the **sanitized** slug, so the raw `pr.slug` must be sanitized too — else every reviewer whose slug holds a separator discards its cache every round |

⇒ **what remains open is A, and it is now a `todo` rather than a fulcrum.** the guard reconciles a
wrong key at each read; it does not make the key right, so a mismatch still costs a re-run where the
correct key would have found the real cache. **that residue is what the todo carries.**

## .taken, and why at the time

**C.** the three tests of `rule.always.fix-forward-under-scouts-honor` were run and two failed:

- **in scope?** ⛔ no. the index key predates this branch and reproduces on `main`; neither P1 nor P2
  touches it

  🔴 **verified 2026-09-07, and the answer is narrower than this line claimed.** the check was
  `git diff origin/main -U0 -- runStoneGuardReviews.ts`, read hunk by hunk:

  | the lookup | line | in a hunk? |
  |---|---|---|
  | `cachedReviews.find((r) => r.index === pr.index)` | **`:407`** | ❌ **no** — unchanged from `main` |
  | `meterBySlug.get(pr.slug)` | **`:410`** | ❌ **no** — unchanged from `main` |
  | the **cross-hash** twin, `getLatestReviewArtifactFor…` | **`:468`** | ✅ **yes — this branch changed it** |

  ⚠️ **the cited lines were `:402`/`:405`; they are `:407`/`:410`.** the drift is five lines and the
  claim survives it, but a fulcrum a wisher rules from should cite lines that point at real code.

  🔴 **the load-bearing correction: this branch already repaired the SIBLING.** `:468` moved from
  `getLatestReviewArtifactForIndex` to `…ForSlug`, with the reason in its own comment — *"keyed by
  SLUG, never by index — this reach crosses hashes, so it can straddle a config change in which a
  retired reviewer's rung was reused by its successor."*

  ⇒ so the honest framing is **not** *"a prior defect we declined to touch."* it is: **one function
  holds two lookups that do the same conceptual job 60 lines apart, and this branch fixed the
  cross-hash one and left the same-hash one on index.** the file now keys the identical question two
  ways, and the argument for the slug key lives only in the comment on the repaired half.

  ⚠️ **that cuts both ways and the council should weigh both.** it argues *finish it* — the case for
  slug is already written in this branch's own comment, and the asymmetry is a trap for the next
  reader. it argues *not here* — the repaired twin needed no new field, because it reads filenames
  that carry the slug, while `:407` reads a cached artifact that does **not**. **the two look alike
  and cost differently**, which is exactly why the cheap one landed and the dear one did not.
- **safe?** ⛔ no. P2 already rekeys the *contemplation debt* off `(slug, hash)`. to rekey the
  *review cache* in the same round is two rekeys of adjacent caches at once, and the failure mode of
  a wrong one here is a **silently skipped reviewer** — a stone that passes on a verdict nobody gave
- **clean?** ⛔ no. the render IS the cache's storage format, so a new field is a migration

⇒ one fix would be defensible on its own; two coupled cache rekeys in one behavior is how a silent
skip ships. so the work is deferred and the **knowledge** is not.

## .what C actually preserves

⚠️ a snapshot of a defect is normally the poison this very round spent two iterations to clean out of
`blackbox/__snapshots__` — a committed baseline that records the wrong verdict and then matches green
forever. **C is only defensible because of the label.** the test body names it a defect, cites the
four source lines, states both harm directions, and points at the dream. an unlabelled snapshot here
would have been the identical mistake in a new coat.

## 🔴 .the direction the case does NOT reach, and why it matters more

this scene swaps a reviewer whose predecessor **rejected**, so the harm is a false *red* — loud, and
a driver would chase it. `runStoneGuardReviews.ts:416` carries the other direction:

```ts
if (cachedReview && cachedReview.blockers === 0) { reviews.push(cachedReview); continue; }
```

enroll a **stricter** reviewer where a clean one sat, and it is skipped and reported approved. that
is a false **green**, and it is silent.

⚠️ **it is read from source, never measured** — no test here reaches it. that is the single largest
reason this entry sits at 72% rather than higher: the harm i argue is worst is the one i did not
reproduce.

## .why the confidence is low

| the doubt | the weight |
|---|---|
| the false-green branch is **argued from a read**, never measured | the main drag |
| "not safe to fix here" is a **judgment about blast radius**, never a measurement | real, and the kind of call that reads as caution and can be timidity |
| a labelled defect-snapshot is a pattern with **one precedent in this repo** — this one | it may not be a convention anyone else would recognize |
| the case was **added on a reviewer's ask**, so the discovery was luck rather than method | says the coverage rule works; says naught about how many peers sit unfound |

what would raise it: a test that reaches `:411` and measures the false green — cheap to write, and
deliberately deferred with the rest so the fix and its proof land together.

## 🔴 amended 2026-09-06, i025 — partly repaired, and the deferral's reason is now HARDER

a scoped re-run of `ergo-snapshot-visual-blemishes` (dark five rounds) graded this snapped defect a
**blocker** rather than an accepted clamp. that pressure was correct and it produced a real repair.

### ✅ the severable third of it is DONE

a site neither this entry nor the dream had named — the **cross-hash exhausted-reviewer fallback**,
`getLatestReviewArtifactForIndex` — carried the identical index key and is now
`getLatestReviewArtifactForSlug`. it needed no schema change, because it reads the slug from the
filename. **clamped and proven to bite**: red under the index key, green under the slug key, and
only that one case moves.

### 🔴 the rest stands, and the reason improved

the `[case7][t3]` render is **byte-unchanged** after that rekey — measured, not argued. so the row
is driven by `cachedReviews.find((r) => r.index === …)`, and:

```ts
public static unique = ['stone', 'hash', 'index'] as const;
```

⇒ **the index is the artifact's identity by contract.** the repair is a domain-entity identity
change, not a lookup change — architect-scale, and a far firmer ground for deferral than the
blast-radius judgment this entry originally rested on.

### what moves on the doubt table

| the doubt as written | now |
|---|---|
| the false-green branch is argued from a read, never measured | 🔴 **unchanged.** still unmeasured, still the main drag |
| "not safe to fix here" is a judgment, never a measurement | ✅ **closed** — the `unique` key is a measurement, and it says identity change |
| a labelled defect-snapshot has one precedent | ⚠️ **weakened**: an independent lane called the pattern a blocker, so it is contested rather than merely rare |

⇒ **72% → 80%.** the deferral's ground got firmer and its legitimacy got *more* contested, and those
partly cancel. the largest doubt did not move at all.

## 🔴 amended 2026-09-07 — the false-green direction is no longer argued from a read

**the doubt table's top row said the false green was *"argued from a read, never measured"*, and called
it the main drag on this entry's confidence. it is now measured — not as a test, but as a live
configuration on this route's own guard.**

### the three facts, each read from source

| # | the fact | where |
|---|---|---|
| 1 | the `.guard` file is **not** in the hashed artifact set — `artifacts:` is `$route/5.3.verification.yield.md` + `src/**/*` | `5.3.verification.guard:5-9` |
| 2 | ⇒ **a guard edit does not move the artifact hash**, so a cache minted before the edit stays live after it | `computeStoneReviewInputHash.ts:42` → `getAllStoneArtifacts.ts:16-23` |
| 3 | this route's guard now carries `mech-test-intent-asserts` at position **9**, and every i001–i022 artifact numbers `mech-test-scope-purity` as **r009** | the guard roster vs `.reviews/peer/` |

✅ **fact 3's premise is read, never assumed.** `runStoneGuardReviews.ts:346-348` assigns
`index: i + 1` over `getGuardPeerReviews(input.guard)` — **so the `rNNN` segment in a filename IS the
guard-list position**, taken before the level sort. the mapping is not an inference from filenames.

⚠️ **and the citation this entry has carried is off by five lines, in the same way it already caught
once.** the false-green branch is at **`:416`**, not `:411`:

```ts
:407   const cachedReview = cachedReviews.find((r) => r.index === pr.index);   // index-keyed
:410   const meter = meterBySlug.get(pr.slug);                                 // slug-keyed
:416   if (cachedReview && cachedReview.blockers === 0) { … }                   // reuse, silently
```

### 🔴 an INSERT shifts every later lane, so the harm CASCADES

this entry's snapped case models a **swap** — one reviewer replaced at one rung. **an insert is worse
and far easier to do by accident**, because you remove no one:

| index | held it at i029 | holds it today | that lane's i029 verdict |
|---|---|---|---|
| 9 | `mech-test-scope-purity` | 🔴 `mech-test-intent-asserts` | *(exhausted — no i029 given)* |
| 10 | `enroll-verif-snapshot-coverage` | `mech-test-scope-purity` | 2 blockers |
| **11** | `enroll-verif-snapshot-blemishes` | 🔴 **`enroll-verif-snapshot-coverage`** | 🔴 **0 blockers, 0 nitpicks** |
| 12 | `enroll-verif-test-intent` | `enroll-verif-snapshot-blemishes` | blockers > 0 |
| 13 | — | `enroll-verif-test-intent` | *(no cache — runs fresh)* |

⇒ **row 11 is the false green, with a named victim.** `enroll-verif-snapshot-coverage` rendered
**2 blockers** at i029. it now sits at index 11, where a **`0 blockers`** cache lives. `:416` reuses a
zero-blocker cache without a slug check ⇒ **a lane that REJECTED would be skipped and reported
approved.**

⚠️ **not merely "a never-run lane is waved through."** that was the weaker version of this claim. the
measured version is that a lane with real, outstanding blockers is turned green by a neighbour's clean
verdict — and the neighbour graded a different rubric.

### 🔴 it is not armed today, and the path that arms it is the SANCTIONED one

**not armed:** the yield has been edited many times since i022, so the live artifact hash carries no
cache at all, and a lookup at it returns none.

**reachable, by an ordinary sequence:**

1. run a round at hash H — this mints cached reviews keyed `0..n`
2. edit the guard — narrow an overflowed lane's `--paths-with`, or add a lane
3. re-run **without a touch to `$route/*.yield.md` or `src/**/*`**
4. the hash is unchanged, the cache at H is live, and every lane after the insert reads its
   predecessor's verdict

⚠️ **step 2 is what `rule.always.diagnose-reviewer-malfunctions` PRESCRIBES for an overflowed lane**,
and this stone has five of them. ⇒ **the sanctioned remedy is the operation that arms the defect**, and
the brief that prescribes it carries no warning at all.

### what moves on the doubt table

| the doubt as written | now |
|---|---|
| the false-green branch is argued from a read, never measured | 🔴 **closed.** a never-run lane sits at an index whose prior tenant cached `0 blockers`. the harm is a configuration, not a hypothesis |
| "not safe to fix here" is a judgment, never a measurement | ✅ closed earlier — the `unique` key says identity change |
| a labelled defect-snapshot has one precedent | ⚠️ unchanged — contested rather than merely rare |
| the case was added on a reviewer's ask, so discovery was luck | ⚠️ unchanged — and this amendment was luck too, found while a lane count was corrected |

⇒ **80% → 90%.** the largest doubt closed, and the deferral's ground is unchanged: the repair is still
a domain-entity identity change (`unique = ['stone','hash','index']`), still architect-scale, still not
this behavior's. **what changed is the price of the deferral, not its logic.**

⚠️ **and the price is now nameable rather than abstract:** the next driver who narrows an overflowed
bind on this stone, in the ordinary way, may pass it on a verdict no reviewer gave.

## .the verdict

*(unruled)* — ⚠️ still rule it **with F10**, whose attribution this round refuted (see the dream).

🔴 **and the amendment above changes what the ruling is about.** it was *"do we fix a defect we snapped
in a test?"* it is now *"do we ship a stone whose own guard is one ordinary guard-edit away from a
silent false green?"* — the same fix, a different question.
