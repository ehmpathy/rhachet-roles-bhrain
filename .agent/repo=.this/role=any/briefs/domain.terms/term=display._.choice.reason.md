# domain.term.choice.reason: display

## .etymology

**inherited, never argued.** `asRouteDisplayPath` and `getReviewDisplayPath` both
predate this cluster and no traveler has disputed the word. so this file documents
extant practice rather than settles a coinage — the same shape as the `fix` dream-kind
row and the `emit` cluster.

what it adds is the **sense**, which was carried by three docblocks that each stated a
different half of it, and by no shared record at all.

### why `display` and not its rejected peers

| rejected | for |
|---|---|
| `pretty` | claims aesthetics. the operations make no aesthetic choice; they pick a root |
| `friendly` | the same, and vaguer — friendly to whom, against what |
| `human` | reads as *"a human's path"*, and it collides with the ehmpathy `rule.require.term-human` sense, where `human` names the **person** |
| `printable` | every string is printable. it names no distinction |
| `short` | 🔴 **actively false.** `getReviewDisplayPath` returns the LONGER absolute form on an escape, on purpose |

⇒ the differentia that settles it: **display names the audience, never the shape.**
a display form is the one a reader parses; what that costs in characters is
whatever it costs.

## .a ROOT, not a boundary-qualified term

`rule.require.boundary-qualified-terms` asks *"a display, of WHAT?"* and the answer is
three subjects — a route path, a review output path, a guard artifact path.

⚠️ **three subjects is not three senses.** in every one it is *the form a human reads
rather than the form the machine holds*, and only the subject varies. that is the shape
already settled for `slug` (four subjects), `emit` (four), and `artifact` — so this
follows the extant precedent rather than opens a new question.

## .evidence — the three disagree on the edge cases, and that is by design

measured 2026-09-04, from a read of all three:

| operation | root | path IS the root | path escapes the root |
|---|---|---|---|
| `asRouteDisplayPath` | `process.cwd()` | `'.'` | a `..` crawl |
| `getReviewDisplayPath` | the caller's cwd | `''` | the **absolute** form |
| `asGuardDisplayPath` | the repo root | `''` | a `..` crawl |

each divergence is justified in its own docblock, and each reason is the **surface**,
not the concept:

- a `route = ` line cannot render empty, so the route form normalizes `''` → `'.'`
- a review output path is handed to a human to open in an editor, and a deep `..` crawl
  reads worse than an absolute path, so that form escapes to absolute
- a guard artifact is a strict descendant of the repo root by construction, so the
  guard form needs neither case

⇒ **that is the useful fact this cluster exists to hold.** a traveler who meets three
`*DisplayPath` operations will reasonably suspect drift and reach to unify them. they
should not: the concept is shared, the **policy is per-surface**, and a merge would
force one surface to take another's edge-case behavior.

⚠️ what a fourth author DOES owe is a stated policy for both cases. the guard form
states that it needs neither and why (a structural argument, not a bet), and its clamp
asserts both halves — `!isAbsolute` **and** `!startsWith('..')` — because the first
alone passes on a crawl.

## .the discovery, and it is the fifth of one class in three days

found by the `learn.domain.terms` sweephook after a round that authored the **third**
`*DisplayPath` operation with no check for the other two.

| # | term | declarations it composed | found by |
|---|---|---|---|
| 1 | `given` / `taken` | 3 dops | sweephook |
| 2 | `slug` | 1 dobj + 3 dops | sweephook |
| 3 | `emit` | 1 dobj + 4 dops | sweephook |
| 4 | the `fix` dream kind | 7 files over 5 days | sweephook |
| 5 | **`display`** | **3 dops** | sweephook |

⇒ every one was caught at **stop time** and none at **authorship time**, which is the
carried candidate in the learner's progress log — *"you named a file after a word"* as
a mechanically checkable cue. n=5 is no longer a sample.

⚠️ **and this instance carries a second failure the other four did not.** the earlier
four were words absent from the glossary; this one is a word whose **two extant
implementations went unread** before a third was authored
(`rule.always.reuse-pavement-before-improvise`). the third turned out to be genuinely
needed — the policies differ — but that was luck rather than a check, and had it been a
duplicate it would have been the fourth copy-paste of a relativization on this one drive.

## .see also

- `term=slug._.choice.reason.md` · `term=emit._.choice.reason.md` — the root-vs-qualified
  argument this reuses
- `rule.require.enumerate-before-you-name` (learner) — the list-then-word discipline that
  settled `short` as false
