# domain.term: dream

term.chosen   = dream
term.kind     = noun
term.boundary = artifact     # SETTLED 2026-08-31 — `artifact` was paved, and it reaches the root
term.synonyms.forbidden:
- todo
- backlog
- ticket
- tech-debt

## .what
a **dream** is **a followup that was seen and not done, recorded with the context that made it
visible.**

it is a two-file contract, and both files are owed:

```
.dream/v$date.$kind.$slug.md            # the DREAM — the repo-wide queue. the ORIGINAL
$route/dreams/v$date.$kind.$slug.md     # a SYMLINK back — so the route shows what it deferred
```

🟡 **the dream file is the original; the route holds the link.** never the reverse — a dream that
lives inside one route dies with it, and the queue is what makes it findable at all.

the `$kind` names what the followup is, so the queue sorts by work type:

| kind | the followup is |
|---|---|
| `entool` | a leftover step a tool should have taken |
| `enbrief` | a lesson that is owed a brief |
| `reseed` | work whose home is another repo |
| `amend` | a change to an artifact that already exists |
| `fix` | a defect in this repo, seen and deferred |

🟡 **`fix` was declared 2026-09-04, after the fact** — it was in use **7 times across 5 days** by
several travelers before it reached this table. the row documents extant practice; it decides no new
policy.

🔴 **the kinds are NOT one axis, and the filename holds one slot.** `entool` · `enbrief` · `amend` ·
`fix` name the **work**; `reseed` names the **home**. a dream that is both takes whichever marker its
author reached for first, so **the queue cannot be sorted by home** — `v2026_09_04.enbrief.telepath-…`
and `v2026_09_04.amend.terseness-lane-…` are both peer-repo work that carries no `reseed`. caught as
`.dream/v2026_09_04.amend.the-dream-kind-fuses-two-axes.md`.

## 🟡 .a dream is CAUGHT locally; it is DISPATCHED separately; it is DELIVERED when the ask is served

`.dream/` is the local queue; the radio is the transmission. **`caught` and `dispatched` are two
states, not one** — a `reseed` dream is dispatched only when a push actually lands.

🔴 **and there is a THIRD state, which this contract omitted until 2026-09-08.** the two above trace
a **`reseed`**'s journey to a peer repo. a **`fix` owned by this repo**, done in the round that
caught it, reaches neither: it is never dispatched (no peer owns it) and the readme's prune rule
fires only *"once the ask is live in the tracker of whichever repo owns it"* — and an in-round fix
has no tracker.

| state | who it is for | the marker |
|---|---|---|
| **caught** | every dream | the file exists |
| **dispatched** | a `reseed` — a peer repo owns the ask | `✅ DISPATCHED <date> — <repo> #<n>, QUEUED` |
| 🔴 **delivered** | a dream **this** repo served itself | `- **status** = ✅ DELIVERED <date>` plus a `## ✅ .delivered` section that cites the clamp and the fix |

⇒ **measured 2026-09-08:** exactly one file in `.dream/` carries a status field —
`v2026_09_04.fix.judge-tally-dies-on-hash-move-after-exhaustion.md`, which **coined** the field
because no contract offered one. every other dream has `kind` · `owner` · `caught` and no way to say
it is done.

⚠️ **the cost is the readme's own stated cost, and it lands one clause short of where the readme
looks.** *"with no prune, `.dream/` is an accumulator rather than a queue, and a reader cannot part a
delivered dream from an owed one without an open of every file."* the prune rule closes that for a
dispatched reseed. **for an in-round fix it was open**, so a later traveler picks up a served ask and
re-derives it before they learn otherwise.

⇒ **a delivered dream is KEPT, never pruned** — that is what parts it from a dispatched one. the
tracker is the queue for a reseed, so the local copy is a second queue and must go; an in-round fix
has no tracker, **so the dream IS the record**, and its `## ✅ .delivered` section is where the clamp
and the fix are cited.

## .refs
where the term composes declared contracts:
- src/domain.roles/learner/briefs/rule.always.catch-dreams-for-followups.md     # the rule
- src/domain.roles/achiever/briefs/rule.always.fix-forward-under-scouts-honor.md # the peer
- .dream/v*.md                                                                  # the queue
- .behavior/*/dreams/v*.md                                                      # the symlinks

## .reason
see the ref-level cluster beside this choice:
- `term=artifact.dream._.choice.reason.md` — etymology, the rejected synonyms, and why it is no `seed`
