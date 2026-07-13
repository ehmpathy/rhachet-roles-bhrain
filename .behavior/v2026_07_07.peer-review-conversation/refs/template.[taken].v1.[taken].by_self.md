this is the shape of a driver's `.taken.by_self` response to a peer reviewer's
`.given.by_peer` critique.

the guard writes the reviewer's critique into
- .reviews/peer/$stone._.review.i$iter.$hash.r$idx._.given.by_peer.$slug.md

you write your contemplation into the paired path (same key, `.given.by_peer` →
`.taken.by_self`)
- .reviews/peer/$stone._.review.i$iter.$hash.r$idx._.taken.by_self.$slug.md

then signal it
- rhx route.stone.set --stone $stone --as contemplated --that $slug

---

the gate checks that this file is PRESENT, not that it holds any particular content.
there is no content bar. but a hollow "done" wastes the loop — the value is a real
reply the reviewer can read on its next round (when it runs with --conversation).

for each critique the reviewer raised, answer one of two ways:
- [REPAIR]: name what you changed, so the reviewer can verify the fix is present in the
  target and drop the point.
- [REFUTE]: name why the critique does not hold, so the reviewer can weigh your argument
  instead of a blind re-raise. you are a peer, not a subordinate — a sound [REFUTE] is a
  valid resolution, you need not change code to be right.

---
---
---

# blocker.1

> quote or name the reviewer's blocker here

[REPAIR] <what you changed> — <where>.
or
[REFUTE] <why the critique does not hold>.

---

# nitpick.2

> quote or name the reviewer's nitpick here

[REPAIR] <what you changed>.
or
[REFUTE] <why the critique does not hold>.
(nitpicks do not gate — a response is optional, but a repaired nitpick is a gift.)
