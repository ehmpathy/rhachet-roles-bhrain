# domain.term: hold

term.chosen   = hold
term.kind     = noun · verb     # the mutex claim on the target, and the act to keep it
term.boundary = learn.terms.hook
term.synonyms.forbidden:
- lock         # names the mechanism class; the hold is one `withSimpleMutex` call, never a hand-rolled lock
- lease        # the lease is the hold's crash bound, one field of it

## .what

the **hold** is the claim a toggle verb keeps on its target's mutex key while it reads, decides, and
writes — the SAME key rhachet's own settings writers hold, in rhachet's cache dir, so a toggle and
an `rhx init`, an `rhx enroll`, or a second toggle never interleave. it spans one
read-modify-write, never a unit of work.

## .refs

- src/domain.operations/learn/termsHook/withTermsHookSettingsHold.ts   # the hold, via `withSimpleMutex`
- src/domain.operations/learn/termsHook/asTermsHookHoldFault.ts        # a busy file, named

## .reason

- `term=learn.terms.hook.hold._.choice.reason.md`
