# howto: run self reviews

## .what
guide for how to run the self reviews a guard asks for before peer reviews run.

## .why
self reviews are not a gate to rush past. they are the work itself. travelers often
misunderstand them — they guess the file path, skim the guide, or treat the promise as a
checkbox. this brief paves the path so the next traveler walks it true.

⇒ **this guide is the HOW. the MANDATE is `rule.always.bear-every-self-review`** — a self
review cannot be overridden, there is no lever to ask for, and the count is the work rather
than a budget. read it before you reach for a shortcut this guide does not describe.

---

## take them seriously 🪷

> the review is the work. not a gate to pass. not a step to complete. the work itself.

when you self review, you are not the author who defends the artifact. you are the
reviewer who questions it severely. question every assumption. read with fresh eyes. these
reviews encode lessons from production, accumulated over generations of trial and error.

a promise without a true review is not a promise — it is a daydream. the guard will know:
it checks that the articulation file holds real findings, not empty words.

- for each issue you find → articulate how it was fixed
- for each non-issue → articulate why it holds
- when you can articulate neither → you have not reviewed. begin again.

---

## the flow

self reviews gate peer reviews. you must promise every self review before any peer
reviewer runs.

```
t0  --as passed              → guard halts, and hands you ONE self review
t1  read the guide + artifact, review slowly
t2  write findings into the path the guard printed
t3  --as promised --that <slug> --into <path>   → guard adjudicates that one slug
t4  --as passed again        → the guard hands you the NEXT one
t5  repeat until all N/N promised → peer reviews finally run
```

### step by step

1. **run `--as passed`.** if the stone has self reviews, the guard halts and shows **one**
   of them: a counter (`review.self 2/4`), its `slug`, its guide, and its
   `articulate into` path.
2. **read the guide and the artifact slowly.** clear your mind. this is dedicated review
   time. look as if for the first time.
3. **write your findings into the path the guard printed.** the path is computable —
   see below — so a mismatch is a typo rather than a mystery.
4. **promise it:** `rhx route.stone.set --stone <stone> --as promised --that <slug> --into <path>`.
5. **repeat** until every self review (`N/N`) is promised. only then do peer reviews run.

## 🔴 one at a time — the ladder is serial

**the guard hands out ONE review per ask, and the next only once this one is promised.**
you are told the total (`2/4`), so the ladder's length is no surprise; you are not told the
other slugs, and there is no way to look them up.

| when… | then… |
|---|---|
| you want to work several reviews at once | 🔴 you cannot. ask, review, promise, ask again |
| you know a later slug's name from a prior round | promise it and the guard answers `challenge:unasked` — that slug has no ask on record |
| you want to see what is still owed | the counter. `2/4` means two more after this one |

🟡 **it handed out all N at once until 2026-09-24, and the fork it invited was never
usable.** a forked lane got a slug and a path and **no guide** — the guide renders only for
the review in hand, and the route is sealed, so a lane could not read the `.guard` to find
its own. its one move was to promise blind to provoke a refusal and read the guide off
that — which `rule.always.bear-every-self-review` forbids outright.

⇒ **the withdrawal repaired a second defect the fork had concealed.** the ask's timestamp is
what the haste cue measures against. with all N minted at the first ask, review 4's ask was
stamped when review 1 was asked — so by the time you met review 4 its clock read forty
minutes and `patience, friend` could never reach you. **one mint per ask fixes that**: each
review's clock starts when you are actually asked for it.

---

## the path 🟡

the articulation path is keyed on `(stone, slug)` — two operands you already hold, so you
can compute it by hand:

```
.behavior/<route>/review/self/for.<stone>._.has-questioned-assumptions.md
                                  └──┬──┘    └──────────┬──────────┘
                                   stone                slug
```

🌙 **it carried an `rN` level until 2026-09-17, and the level is retired.** if you meet an
older guide, a stale path, or your own memory of one: there is no `rN` any more. the level
was a derived ordinal, three call sites derived it three ways, and two emits then named two
different files for one owed review. **it was deleted rather than reconciled.**

### `--into` is required, and it is why a mismatch reads as a diff

`--as promised` takes `--into <path>` — the path you actually wrote to. it is a second
operand, so the guard can show you a **difference** rather than merely report a failure:

```
you named  = …/review/self/for.1.vision._.r1.design.md
it is owed = …/review/self/for.1.vision._.design.md
   └─ rhx mvsafe --from <yours> --into <owed>, then promise again
```

⇒ with one operand the guard could only say *"the articulation is absent"*, which names
where it looked and leaves you to guess what it read instead.

### the freshness bar

the guard also checks the file is **newer than the ask**. a leftover articulation from a
prior round is refused, and both stamps are named. if you wrote the file moments *before*
the guard asked, re-save it and promise again.

---

## the owl's wisdom 🌙

> the guard names the path — and you can compute it yourself.
> write where it points, then name where you wrote.
> question yourself severely — the review is the gift.
> patience, friend. tea first. 🍵
