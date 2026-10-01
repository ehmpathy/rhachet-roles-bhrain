# howdoes: a self-review repair restarts its own dwell timer

> **a self-review that repairs an artifact resets the 30s dwell it must then wait out.** the
> mechanism at work, not a defect — and it reads as one.

`howto.run-self-reviews` carries the **level** half of this (*"the guard assigns the level — you do
NOT"*). this carries the half it omits: **what a repair actually costs, and what the correct sequence
is.**

## 🔴 .the correction — the level does NOT move with the hash

this brief said it did, and that was wrong. measured 2026-09-09, from the source rather than from
a pattern in the output:

```ts
const reviewIndex = getSelfReviewIndex({ selfReviews, slug: input.that });  // stepRouteStoneSet.ts:160
//  → selfReviews.findIndex(r => r.slug === input.slug) + 1                 // getSelfReviewIndex.ts
```

⇒ **`rN` is the slug's 1-based position in the guard's `self:` list.** it is fixed per slug, and it
depends on the hash, the artifacts, and the attempt count not at all.

| what actually moves `rN` | what does NOT |
|---|---|
| you promise a different slug — slug 3 of 5 is always `r3` | an artifact edit |
| the guard's `self:` list is reordered | a hash change |
| | a re-attempt on the same slug |

🟡 the wrong claim came from a real pattern in the output:

- the level went r1 → r2 → r3 → r4 → r5 across this stone, and each step coincided with an
  artifact repair
- it coincided because the repairs happened between slugs, never because the repairs caused it
- the correlation was perfect and the causal read was wrong

⇒ the lesson under the lesson: a pattern observed in output is a hypothesis, and the source is the
test. this brief asserted the hypothesis as mechanism for a full round.

## .the mechanism, measured

three operations, and the whole behavior falls out of them:

| where | what it does |
|---|---|
| `computeStoneReviewInputHash.ts:37-55` | hashes the guard's declared artifacts — git blob hashes, sorted, shake256 |
| `getSelfReviewChallengeDecision.ts:59-67` | looks up the trigger report by that hash. 🔴 no report → `challenge:first`, and it starts the 30s timer now |
| `getSelfReviewChallengeDecision.ts:120-123` | `elapsed < 30_000` → challenged again |

⇒ so **an artifact edit mints a new hash, which has no report, which restarts the clock at zero.**

## 🔴 .the bind, and why it is not a trap

a self-review is *supposed* to find issues, and to find an issue means to repair an artifact:

```
review → find an issue → repair an artifact → hash changes
      → no report exists for the new hash → dwell restarts → your promise is refused
```

🟡 **it reads as a punishment for a review done well.** it is not — it is the guard's claim that
an artifact that just changed has not yet been reviewed in its current form, which is the same
claim `rule.always.bear-every-self-review` makes when it says the count is the work.

## .the correct sequence — repairs FIRST, then the write, then wait

| # | act | why in this order |
|---|---|---|
| 1 | make every artifact repair | each one moves the hash; batch them so the clock starts once |
| 2 | attempt the promise | it will be refused, and the refusal prints the exact path |
| 3 | write the review to that exact path | ✅ `review/self/` is not in the artifact set, so this does not move the hash |
| 4 | make no further artifact edits, wait ~30s | the clock is now live and will not be reset |
| 5 | promise | allowed |

🔴 **step 3's parenthetical is the fact the whole sequence rests on.** `getAllStoneArtifacts` reads
the guard's `artifacts:` globs, and `review/self/` has its own `.gitignore`
(`findsertReviewSelfGitignore`). so the review file you write is invisible to the hash — you can
write and rewrite it freely, and only edits to the *reviewed* artifacts cost you the clock.

🟡 and the same holds for a write to `.agent/` or `.dream/` — both sit outside `$route`, so both
are outside every artifacts glob. a lesson externalized mid-dwell costs no clock.

## .the cues

| when… | then… |
|---|---|
| a promise is refused and the path is unchanged | the dwell. make no artifact edits and wait |
| a promise is refused and the printed path has a different `rN` | 🔴 you are on a different slug, never a different iteration. `mvsafe` to the printed path — never compute the level |
| 🔴 the refusal carries a `🍂 what have you seen?` header and `the articulation is absent` | you wrote to the wrong path. `mvsafe` it — see the discriminator below |
| you assume an artifact edit moved the level | 🔴 it did not. see the correction above |
| the `🍂 what is the rush?` banner appears | a re-attempt inside the window. `.uptil` exists, so it grades you as rushed |
| you are mid-review and spot an artifact repair | make it — and expect the clock to reset. that is the review at work |
| you would batch repairs to dodge the timer | ✅ legitimate, and it is step 1 above. dodge the RESET, never the dwell |
| you attempt a third time on one hash | it is allowed without the timer (`attempts >= 3`). 🟡 to aim for that is the shortcut `rule.always.bear-every-self-review` forbids |

## 🔴 .the DIRECTORY half — and the level cue does not cover it

**the pitfall is stated everywhere as a `rN` pitfall, and the `rN` is only half the path.**
`howto.run-self-reviews` says *"never compute the level"*; the cue table above said the same.
⇒ **a driver who gets the level right and the directory wrong is warned by neither.**

```
👎  review/self/for.$stone._.r8.$slug.md                    ← repo root. the guard never looks here
👍  $route/review/self/for.$stone._.r8.$slug.md             ← measured: this is where rungs 1-7 sit
```

🟡 the `$route/` prefix is the half that goes missing, because the halt renders the path
inside a tree and a reader's eye takes the tail. copy the whole line, never the filename.

### the discriminator — two refusals that look alike

both print the same `🗿 patience, friend / the pond barely rippled` block, so the block itself
sorts them not at all. the header above it is the whole signal:

| the refusal opens with | the cause | the fix |
|---|---|---|
| `🗿 patience, friend` alone | the dwell — an artifact moved and the clock restarted | make no artifact edit, and wait |
| 🔴 `🍂 what have you seen?` + `the articulation is absent` | the path — the guard looked and found no file | `mvsafe` to the printed path |

⇒ 🔴 **and the second can HIDE behind the first.** a wrong-path write is only reported once the
dwell has elapsed — before that, the dwell refusal fires first and says naught about the path. so
a driver can re-read, re-reason, and re-attempt several times while the real defect is that the
file sits in the wrong directory the whole while.

🟡 the cheap check costs one glob, and does not wait for the dwell:

```sh
rhx globsafe --pattern "$route/review/self/*" --long   # do your siblings sit here?
```

measured 2026-09-14 on this route: r8 was written to `<repoRoot>/review/self/` while rungs 1-7
all sat in `$route/review/self/`. two dwell refusals passed before the path halt surfaced it.

## 🟡 .use the dwell, do not poll it

`sleep` is not on the driver's permission allowlist, and a retry loop is the shortcut the guard
exists to refuse. the dwell is wall-clock, so spend it on work that does not touch an artifact:

- read source you cited at summary grain — a read moves no hash
- externalize a lesson into `.agent/` — outside the artifact set
- catch a dream into `.dream/` — also outside it

⇒ measured on `v2026_09_09.feat-prescribed-brain-per-stone`: a dwell spent on a line-by-line read of
`stepRouteDrive.ts` raised fulcrum `F7` from 60% to 85% and de-coupled it from that route's dirtiest
open ask. **the largest find of that review exists because a timer would not let the driver leave.**

## .see also

- `howto.run-self-reviews` (bhrain/driver) — the level pitfall, and the flow
- `rule.always.bear-every-self-review` (bhrain/driver) — why the count is the work, and why the
  plowthrough hatch is not a permission
- `getSelfReviewChallengeDecision.ts` — the four decisions, and the hashbar note that governs whether
  a hash change resets the timer at all
