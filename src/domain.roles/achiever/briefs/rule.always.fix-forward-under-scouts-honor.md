# rule.always.fix-forward-under-scouts-honor

## .what

> **when you see a small, safe, clean fix — do it now. never defer it.**

and when it is genuinely too large to ride along, **the deferral is not free**: it costs a caught
dream, or a named fulcrum, or both. what it may never be is a mention that evaporates with the
round.

```
see a fix
   ├─ small + clean  →  🔴 DO IT NOW
   └─ too big        →  catch a dream  (+ a fulcrum, if the deferral was a JUDGMENT)
```

## .why — a deferral costs more than the fix did, and the gap widens

three costs, and each one compounds:

1. **you already paid to understand it.** you are in the file, you hold the context, you can see
   why the fix is right. that comprehension is the expensive half, and it is spent either way. to
   defer is to throw it away and buy it again later, at full price
2. **the mention evaporates.** *"we should also fix X"* said mid-round is gone the moment the
   round is. it feels like a record and is not one — which is the exact failure
   `rule.always.archive-the-wishers-words-verbatim` (learner) exists to prevent, one level down
3. **deferrals compound, and a queue is the proof.** on 2026-08-30 this repo's radio queue held
   **41 open, 0 claimed** — a growth-only backlog of work each of which was small when it was
   seen, and each deferred by someone who could have done it

⇒ the asymmetry is the whole argument: **a small fix costs seconds now and a re-derivation later.**

## .the cues — when → then

| when… | then… |
|---|---|
| you spot a typo, a stale comment, a dead line, a wrong path **inside a file you already touched** | 🔴 fix it. this is the free case, and it has no exceptions |
| you find yourself about to write *"we should also…"* | 🔴 stop. can you do it in this turn? then do it |
| you find yourself about to say *"i'll flag that as a follow-up"* | a spoken note is not a follow-up. **catch a dream, or do it** |
| the fix is real work — a rename across files, a contract change, a migration | catch a dream **and** raise a fulcrum: the choice to defer was a judgment |
| you are **unsure** whether it is small | 🔴 it probably is. try it. a fix that turns out large is a revert, and a revert is cheap |
| you defer because the fix is **dirty** to pull in — it ripples | that is a legitimate defer, and it is precisely the case that owes a **fulcrum** |

## 🔴 .think critically about whether you can pull it in SAFELY and CLEANLY

the test is not *"is this in scope?"* — scope is the excuse a deferral hides behind. the test is
two questions about the **fix**, and both must pass:

> **1. is it SAFE?** does it touch behavior beyond what you came for, or risk work you cannot see?
>
> **2. is it CLEAN?** does it land in the diff you already have, or does it ripple into files,
> contracts, and callers this change never intended to open?

| safe | clean | verdict |
|---|---|---|
| ✅ | ✅ | 🔴 **pull it in now.** there is no defensible reason not to |
| ✅ | 🔴 | **defer — and raise a fulcrum.** the dirt is the reason, and the reason is what the council reads |
| 🔴 | — | **defer — and raise a fulcrum.** unsafe is a harder stop than unclean |

⚠️ **"i wasn't asked to" is not one of the two questions.** scouts honor is exactly the practice of
the fix nobody asked for. a change that leaves a file worse than it found it satisfied its ask and
failed the round.

## ⚠️ .a deferral owes a DREAM, and a judged deferral owes a FULCRUM too

they are different artifacts and both may be owed:

| artifact | records | so that |
|---|---|---|
| **a caught dream** | the *work* — what is still owed, and where | the next traveler finds it without you |
| **a fulcrum** | the *decision* — that you saw it, judged it dirty, and chose to defer | the council can overrule the judgment |

⇒ **a fix deferred for size gets a dream. a fix deferred for DIRT gets both** — because a
dirt call is a judgment about ripple cost, and a judgment made alone is exactly what a fulcrum
list exists to surface (`rule.always.itemize-the-fulcrums-you-best-guess`, driver).

## .the anti-patterns

- **the batch** — five small fixes gathered to do "all at once" at the end. the end does not come,
  and the context that made each one cheap is gone by then
- **the smuggled refactor** — the mirror failure: a large change that ripples, ridden along under
  scouts honor. that is what the CLEAN question refuses, and it breaks the diff for its reviewer

## .enforcement

- a small, safe, clean fix seen and deferred = **blocker**
- a deferral with no caught dream = **blocker** — the record is the price of the defer
- a deferral for **dirt** with no fulcrum raised = **blocker** — the judgment is unreviewable
- a large change that ripples, smuggled in under scouts honor = **blocker** — it fails CLEAN

## .see also

- `rule.prefer.scouts-honor` (ehmpathy/mechanic) — the parent trait; this adds the deferral
  contract the general rule has no place for
- `rule.always.catch-dreams-for-followups` (learner) — what a caught dream is, and where it lands
- `rule.always.itemize-the-fulcrums-you-best-guess` (driver) — where a dirt-deferral is recorded
- `rule.always.enskill-the-tactics-you-discover` (learner) — the same asymmetry, for a tactic:
  cheap at the moment of use, expensive to reconstruct
