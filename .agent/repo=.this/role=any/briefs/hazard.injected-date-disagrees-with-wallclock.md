# hazard.injected-date-disagrees-with-wallclock

## .what

> **the date in session context is an inherited claim. the date a hook derives is the contract.**

before you write a **date-named artifact**, derive the date from the filesystem:

```
rhx globsafe --pattern '<the dir>/*.md' --long     # read the mtime of a file you JUST wrote
```

the artifacts this binds, in this repo:

| artifact | who computes its path |
|---|---|
| `progress.$date.md` | the learner sweephook, from wall-clock |
| `.dream/v$date.$verb.$slug.md` | you, by hand |
| `.behavior/v$date.$slug/` | `rhx init.behavior`, from wall-clock |

## .the tell — a check that re-fires SECONDS after you satisfied it

this is the whole diagnostic, and it is mechanical rather than clever:

> **a hook that re-fires immediately after a fresh write reports a real gap at an address you did
> not write to.**

⚠️ **do not read it as a flaky hook and do not redo the work.** the content was correct; the
*address* was wrong. one `globsafe --long` separates the two, and the mtime of the file you just
wrote is the authoritative clock — that write is the one event whose time is known.

## .why it happens

the session context carries a `currentDate`. it is a **summary of the world**, produced once, and
it can be days behind the machine. a hook does not read it — a hook calls the clock.

⇒ so two actors compute the same fact from different sources, and only one of them decides where
a file must sit.

## .the measured case

**2026-08-30.** session context read `Today's date is 2026-08-28`. four learner articulations were
appended to `progress.2026-08-28.md`. the sweephook looked for `progress.2026-08-30.md`, found
none, and graded the distillation **stale** — correctly. it re-fired within seconds of each write.

⇒ **four correct articulations, written to an address no reader visits.** that is the same defect
class as a brief wired into a role with no `boot.yml`: the content is right and it reaches no one.

⚠️ and the record could not be fully repaired. **one mtime cannot date four appends**, so the true
day of each is unknown, and the file now says so rather than a guess. a fabricated timeline is
worse than an absent one.

## .the cues — when → then

| when… | then… |
|---|---|
| you are about to write a **`$date`-named** file | derive the date from a fresh mtime, never from context |
| a hook **re-fires seconds** after you satisfied it | 🔴 check the address before you redo the work |
| you are about to append to a `progress.$date.md` | confirm `$date` is today's, by the filesystem |
| you must reconstruct **when** several past writes happened | you cannot — one mtime dates one event. say unknown |

## .the parent claim

`rule.require.trust-but-verify` (ehmpathy/mechanic) states it generally: inherited claims drift
from reality and must be checked before they are acted on. it ships in a **separate package**, so
it is cited here rather than extended.

**what this adds** is the specific proxy and the specific tell — an injected `currentDate`, and a
check that re-fires at once. the general rule offers no way to notice that *this* claim is the
stale one.

## .enforcement

- a `$date`-named artifact written from the context date, with no filesystem check = **blocker**
- a hook diagnosed as flaky when it re-fired immediately after a write = **blocker** — the
  re-fire is the signal, and it names an address defect
- a reconstructed timeline for writes that share one mtime = **blocker** — state unknown instead

## .see also

- `rule.require.trust-but-verify` (ehmpathy/mechanic) — the parent claim this specializes
- `rule.always.diagnose-reviewer-malfunctions` (driver) — the same discipline for a broken
  reviewer: diagnose the cause before you escalate or redo
- `philosophy.entoolment-is-the-pinnacle` (learner) — why the durable fix is to let another actor
  compute the fact, rather than to be more careful about it
