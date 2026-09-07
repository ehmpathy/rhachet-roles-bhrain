# rule.always.catch-dreams-for-followups

## .what

> **every followup you do not do becomes a caught dream — and the route that found it keeps a
> symlink to it.**

🟡 **first run the SAFE/CLEAN test** (`rule.always.fix-forward-under-scouts-honor`). a dream is the
second-best outcome: safe **and** clean means fix it now, and no dream is owed. this rule governs
what the *large* half owes.

⇒ the two boot together in the driver, and until 2026-09-07 they did not — the repair half sat in
the achiever, so a driver held this rule alone and read the dream as the primary move rather than
the fallback. the repair was DELIVERY, never a third rule: both halves live here now, and the
achiever and the learner keep theirs by symlink.

the shape and the four kinds are the `dream` contract — `term=artifact.dream._.choice._.md`.

## .why the dream — a spoken followup is a deletion in a polite coat

*"we should also fix X"* said mid-round is gone the moment the round is. it **feels** like a
record, which is the whole failure: nobody writes it down precisely because it already felt
written.

three things a caught dream keeps that a mention cannot:

| kept | why it matters |
|---|---|
| **the cue that fired** | *what made you notice* is the part a later reader cannot reconstruct |
| **the reason it was deferred** | so the next traveler does not re-derive the same judgment and defer again |
| **the shape of the fix** | you held the context. that comprehension is the expensive half, and the dream is where it survives |

⇒ the same claim `rule.always.archive-the-wishers-words-verbatim` makes about a quote, and
`rule.always.itemize-the-fulcrums-you-best-guess` about a fork: **write it at the moment, or write
a reconstruction later.**

## 🔴 .why the symlink — a dream in the queue loses its origin

`.dream/` is a flat repo-wide queue. drop a dream in it and the round that found it is unrecorded:
a reader of the route cannot see what it deferred, and a reader of the dream cannot see what was
underway.

the symlink closes both directions at the cost of one command, and **its location IS the
provenance** — no prose citation to drift.

```sh
rhx symlink \
  --at "$route/dreams/v$date.$kind.$slug.md" \
  --to ".dream/v$date.$kind.$slug.md" \
  --mode relative --idem findsert
```

## 🟡 .a deferral for DIRT owes a fulcrum too — the dream is not enough

the dream records the **work**; the fulcrum records the **decision** to defer it. a dream alone
reports the work and hides the call — and the ripple estimate that made it dirty is a best guess,
which is exactly what a fulcrum list exists to surface
(`rule.always.itemize-the-fulcrums-you-best-guess`, driver).

## .the cues — when → then

| when… | then… |
|---|---|
| you are about to say *"i'll flag that for later"* | 🔴 that phrase IS the cue. run the two questions, then fix it or catch it |
| a rule you just wrote fires on your very next action, and you route around it | 🔴 the sharpest cue there is. catch it — the rule found a real gap and you skipped it |
| you hit a **broken paved path** — a documented command that fails, a stale readme | catch it. a documented defect is worse than an absent doc |
| a fix belongs to **another repo** | catch it as a `reseed` dream. a tree adopts only what is scoped to itself |
| you cannot push a seed to the radio | 🔴 `.dream/` is the local queue. caught is not dispatched |
| a fix is **large** — a rename across files, a contract change, a migration | catch it, with the shape of the fix. that shape is what makes it actionable later |
| you finish a route with an empty `$route/dreams/` | 🔴 suspicious. a real round finds at least one item it could not clean |

## .the shape of a dream

```markdown
# 🌙 dream: $what-is-owed

**kind**: $kind · **owner**: $repo · **caught** $date

## .the cue that fired
what made you notice — the rule, the failure, the surprise

## .the gap, precisely
what is broken or absent, with evidence a reader can check

## .the shape of the fix
what you would have done, while you still hold the context

## .why it is not done in this round
the SAFE/CLEAN answer, stated plainly
```

🟡 **`.the shape of the fix` decays fastest and pays the most.** it is written from context you
hold now and will not hold later, and it is what turns a dream from a complaint into a task.

## .enforcement

- a followup mentioned and never caught = **blocker** — a spoken note is not a record
- a dream caught for a fix that was **safe and clean** = **blocker** — it was a fix, not a followup
- a dream with no symlink at the `$route/` that found it = **blocker** — the origin is lost
- a dream that lives **inside** a route rather than in `.dream/` = **blocker** — it dies with the
  route and the queue never sees it
- a dream caught for **dirt** with no fulcrum raised = **blocker** — the judgment is unreviewable
- a dream with no `.the shape of the fix` = **nitpick** — it reports a problem and hands over no work

## .see also

- `rule.always.fix-forward-under-scouts-honor` — its PAIR, and the SAFE/CLEAN test this defers to.
  they boot together here; a role that holds one alone will invert the default
- `domain.terms/term=artifact.dream._.choice._.md` — the contract: the two files, and the four kinds
- `rule.always.itemize-the-fulcrums-you-best-guess` (driver) — where the dirt-judgment is recorded
- `rule.always.entool-the-skills-you-touch` — *a manual workaround left unrecorded = blocker*;
  a caught dream is how that record is kept
- `rule.always.scope-onetime-lessons-to-the-behavior` — the peer placement question, for a lesson
- `philosophy.pavement-saves-nature` — a broken paved path is the highest-value dream there is
