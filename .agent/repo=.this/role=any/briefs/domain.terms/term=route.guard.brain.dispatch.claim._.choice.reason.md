# domain.term.choice.reason: route.guard.brain.dispatch.claim

## .etymology

from the mineral-rights sense: a claim is a public assertion of intent over a plot, honored by
convention and by a record rather than by a fence. it lapses if it is not worked.

⇒ every property the word carries is one this mechanism has:

| the mineral sense | here |
|---|---|
| a stake and a filed record | a file on disk, keyed by the stone |
| honored by convention | advisory — any writer could ignore it |
| lapses if unworked | **expires by mtime**, at 15s |
| it reserves an intent, not a fence | a peer stands down; it is not prevented |

🔴 **a `lock` carries the opposite of the last three.** that is not a shade of sense — it inverts
what a reader predicts when the holder dies.

## .disputes

### dispute: lock — raised 2026-09-15 — status: RESOLVED (keep `claim`)

- raised.by  = the mechanism's own neighbours. this module already declares
               `withDriveStateLock`, `isDriveStateLockHolderAlive`, and
               `delAbandonedDriveStateLock` — so `lock` is a word already in the file
- claim      = a second word for an on-disk mutual-exclusion record is a synonym, and the
               neighbours settle it: call it a lock
- counter    = 🔴 **they are two different mechanisms, and the difference is the failure mode.**
               the drive-state lock has a liveness probe on its holder
               (`isDriveStateLockHolderAlive`) and an explicit reaper
               (`delAbandonedDriveStateLock`). the dispatch claim has neither: it carries no
               holder pid, nobody probes it, and its only recovery is that its mtime ages out.
               ⇒ to name them alike would predict a reaper that does not exist
- resolution = keep both words. `lock` for the exclusion the state file holds, `claim` for the
               advisory reservation the dispatch takes.
               🟡 this is the inverse of the usual synonym repair — the adjacent word was the
               more familiar one and it was still refused, because
               `rule.forbid.domain-term-ambiguity` forbids one word over two concepts as hard as
               it forbids two words over one

### dispute: marker — raised 2026-09-15 — status: RESOLVED (forbidden, and unavailable)

- raised.by  = the natural english word for a file that marks a state
- claim      = `marker` reads plainer than `claim` to a first-time reader
- counter    = the word is already spoken for. `term=glyph._.choice._.md` declares `marker` for
               the role-glyph slot, and a grep proves a word unused rather than unclaimed
               (`im_an.obsessive_learner.for.domain.glyphs`)
- resolution = `marker` is forbidden here. ⇒ the durable lesson is the glyph brief's own: **read
               the glossary before the grep**, since a reserved word greps clean the whole time

## .evidence

### the two on-disk records, side by side

| | `DriveStateLock` | the dispatch claim |
|---|---|---|
| carries a holder identity | ✅ yes, and it is probed | 🔴 no |
| has an explicit reaper | ✅ `delAbandonedDriveStateLock` | 🔴 no |
| recovery, if the holder dies | the reaper clears it | 🟡 its own mtime ages out, at 15s |
| honored by | the operation that takes it | every peer, by convention |

⇒ **four rows, and three of them differ.** that is the measured case that two words are owed.

### why the window is 15s, and not a number picked for comfort

`CLONE_SUBMIT_VERIFY_TIMEOUT_MS = 15000` (`rhachet/dist/domain.operations/clone/constants.js:30`)
is the child's own submit-verify lifetime.

⇒ **the claim's expiry is sized to the act it reserves**, so a claim can outlive its dispatch by no
useful margin. a shorter window would clear a claim while its child still ran, which is the
interleave this exists to prevent; a longer one would extend the KILL-MID-AWAIT stand-down for no
gain.

## .invariants

- a claim is written **inside** the state lock's critical section, and its dispatch runs **outside**
  it — so the section stays sub-millisecond
- a claim is LIVE while its mtime is within 15s, and dead thereafter. no other liveness test exists
- a peer that reads a LIVE claim returns `{ outcome: 'none' }` and emits no line
- a claim is advisory: it makes a second dispatch unlikely, never impossible
