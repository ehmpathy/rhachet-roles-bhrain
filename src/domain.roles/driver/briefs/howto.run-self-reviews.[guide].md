# howto: run self reviews

## .what
guide for how to run the self reviews a guard asks for before peer reviews run.

## .why
self reviews are not a gate to rush past. they are the work itself. travelers often
misunderstand them — they guess the file path, skim the guide, or treat the promise as a
checkbox. this brief paves the path so the next traveler walks it true.

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
t0  --as passed              → guard halts: "review.self 1/4 — slug = <slug>"
t1  read the guide + artifact, review slowly
t2  write findings into the EXACT path the guard printed
t3  --as promised --that <slug>   → guard halts: "review.self 2/4 ..."
t4  repeat until all N/N promised → peer reviews finally run
```

### step by step

1. **run `--as passed`.** if the stone has self reviews, the guard halts and shows the
   next one: a counter (`review.self 2/4`), a `slug`, a guide, and an `articulate into`
   path.
2. **read the guide and the artifact slowly.** clear your mind. this is dedicated review
   time. look as if for the first time.
3. **write your findings into the exact path the guard printed.** see the level pitfall
   below — do not guess the path.
4. **promise it:** `rhx route.stone.set --stone <stone> --as promised --that <slug>`.
5. **repeat** until every self review (`N/N`) is promised. only then do peer reviews run.

---

## the level pitfall ⚠️

the self review filename carries a **level** marker — the `rN` prefix:

```
.behavior/<route>/review/self/for.<stone>._.r2.has-questioned-assumptions.md
                                            └┬┘ └──────────┬──────────┘
                                          level             slug
```

**the guard assigns the level. you do not.** the `rN` does *not* simply count 1, 2, 3 in
order of your reviews — it tracks the review iteration, and it can repeat or jump (e.g.,
`r1` then `r2` then `r2` again across different slugs).

> ⛔ do not compute the level yourself. do not increment it by hand.
> ✅ copy the `articulate into` path the guard prints, character for character.

if you write to the wrong level (e.g., `r1` when the guard asked for `r2`), the guard
reports "the articulation is absent" and refuses your promise — because it looks for the
file at *its* path, not yours.

---

## the owl's wisdom 🌙

> the guard names the path. you walk to it, not past it.
> read the level it prints. write where it points.
> question yourself severely — the review is the gift.
> patience, friend. tea first. 🍵
