# seed S15 — a passed level is not re-opened

## .said — verbatim, 2026-09-07

> also, should we just never reopen lower levels once we cross to higher levels of reviewers? e.g.,
> once l1 passes, never run them again? maybe we should catch a dream for that

> dispatch a task about this too; ◻ Catch the dream: do not reopen lower levels once the ladder
> passes them

## .settled

**the proposal is sound and its trigger word must be `passes`, never `terminal`.** the two are not
the same set, and the difference is what makes one version safe and the other a silent blindfold.

| a level is… | may it be skipped on a later round? |
|---|---|
| **approved** — every lane returned `0 blockers` | ✅ **yes.** a lane that read the code and approved has spoken |
| **exhausted** | ⛔ no — a spent budget is not a verdict |
| **malfunction** / **constraint** | 🔴 **absolutely not.** the lane rendered no verdict at all |

`rule.always.converge-to-terminal` groups all four as **terminal**, because terminal answers *"may the
ladder advance?"*. **this proposal asks a different question** — *"has this rubric read the code?"* —
and only `approved` answers it yes.

## 🔴 .why the distinction carries the whole weight here, of all drives

**measured at i029: all five l1 lanes returned `constraint ✋`.** every one overflowed its window and
reviewed no code. under a `terminal`-keyed skip:

- five rubrics would be permanently retired though not one had read the diff
- each would still hold the one blocker its unreadable verdict minted
- the stone would be blind on five axes and owe five debts it could never re-derive

⇒ **the skip would convert a transient overflow into a permanent gap**, and the tell — a lane that
never speaks again — is indistinguishable from a lane that approved.

## ⚠️ .the second bound — the hash

an approval is an approval **of an artifact set**. so the skip must be keyed to an unchanged artifact
hash, or a driver edits the code after l1 approves and l1 never sees the edit.

⇒ that is the extant clean-lane cache (`howdoes.the-guard-caches-a-clean-lane-by-artifact-hash`)
raised from a per-round optimization to a per-ladder one. **the mechanism already exists; what the
proposal changes is its scope.**

## .the shape of it

> once every lane at level N returns `0 blockers`, level N is **settled** for that artifact hash, and
> later rounds at levels > N do not re-run it. any change to the artifact set un-settles it.

**it does not touch the wish's invariant.** P1 and P2 govern who may enter a round; this governs which
lanes run once entry is granted.

## .landed

- ⏳ `.dream/v2026_09_07.fix.terminal-lower-levels-rerun-after-the-ladder-moved-past-them.md` — owed
- ⏳ the symlink into `$route/dreams/` — owed
- ⏳ the radio dispatch — owed, and gated on the dream text
