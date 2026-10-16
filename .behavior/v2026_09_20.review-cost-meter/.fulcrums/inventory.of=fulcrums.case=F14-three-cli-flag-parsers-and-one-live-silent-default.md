# F14 — the cli flag read is cured twice and broken four times, in one directory

- **rework** = clean (the extract) / 🔴 dirty (the re-point)
- **status** = OPEN — a wisher call on whether the extract belongs to this branch
- **confidence** = **99%** the observation is right · 🟡 **65%** the deferral is right
- **raised** = 2026-09-22, from `enroll-impl-arch-defects` i014
- 🔴 **revised** = 2026-09-22 at i015 — the same lane re-raised `:222` as a **blocker** with a
  *"behavior-neutral"* one-line repair. a read refutes that repair outright; see
  *".the `else` cannot simply be added"*. the deferral's confidence rises 40% → 65% as a result

## .the fork, stated fairly

this branch added a three-state cli flag read — `absent | given | valueless` — to
`review._.cost.ts`. the question is whether that read is owed a shared home **in this diff**, and
whether the sites that lack it are this branch's to repair.

| option | what it costs | what it buys |
|---|---|---|
| **A — as shipped** | naught | the new command refuses a valueless flag; four other sites do not |
| **B — extract only** | a new `domain.operations/cli/` home + call-site edits | one read, so a fifth reinvention is impossible. **no behavior moves** |
| **C — extract AND re-point** | B, plus a behavior change to three shipped commands | the four live silent defaults are closed |

## 🔴 .the census, verified by read — and it moved this row twice

graded on one question: **can this site tell an ABSENT flag from a VALUELESS one?**

| the file | the site | verdict |
|---|---|---|
| `review._.cost.ts` | `:143`, `:159` — `state: 'valueless'` | ✅ **cure** |
| `review.by.ts` | `:76`, `:116`, `:194` — `valueAbsentFlags` + a refusal | ✅ **cure**, independently written |
| `review.ts` | `:218` (repeatable branch) | ✅ cured, **on purpose** |
| `review.ts` | 🔴 `:222` (non-repeatable branch) | 🔴 **hazard — AND a required tolerance.** see below |
| `reflect.ts` | 🔴 `:114` | 🔴 **hazard** |
| `route.ts` | 🔴 `:200`, `:226` | 🔴 **hazard, twice** |

⇒ **two independent cures, four hazard sites across three files** — and `review.ts` carries one
of each, eight lines apart.

## 🔴 .the fact that makes this more than a tidiness row

`review.ts:222` has no `else`:

```ts
} else if (value && !value.startsWith('--')) {
  options[key] = value;
  i++;
}
```

⇒ `rhx review --diffs --paths 'src/**'` leaves `diffs` **`undefined`** and the command runs on
its default. that is the identical failhide `review._.cost.ts:128-138` documents as the reason
its own 3-state read exists.

🟡 **and eight lines above, the same function treats the case correctly** for repeatable flags —
*"presence is recorded (as []) even when the value is absent or another flag, so review() can
fail loud on a bare `--optional`."*

⇒ so this is not four parsers that drifted. it is **one parser that already knows the hazard and
applies the cure to one of its two branches**, beside two files that never got either.

## 🔴 .the `else` cannot simply be added — the tolerance at `:222` is REQUIRED

the i015 lane graded `:222` a **blocker** and proposed a repair it called narrow and
behavior-neutral: add the absent `else`, independent of any shared-reader extraction.

🔴 **that fix would halt round 1 of every peer-review lane in this repo and in every repo
downstream.** the chain, verified by read:

| # | the fact | the source |
|---|---|---|
| 1 | every guarded peer lane declares `--conversation $conversation` | `research.review-cost-and-cache:268`, and every `*.guard` on the tree |
| 2 | the runner builds that value as `conversationFiles.map(…).join(',')` | `runStoneGuardReviews.ts:228-230` |
| 3 | round 1 has **no** prior conversation — the enumerator EXCLUDES the current `{iteration, hash}` | `runStoneGuardReviews.ts:214-218` |
| 4 | so `$conversation` substitutes to the **empty string** | `runStoneGuardReviews.ts:1212` |
| 5 | the shell then drops the token, and argv reads `--conversation --output <path>` | the `run:` line is a shell command |
| 6 | `:222` sees `value.startsWith('--')`, tolerates it, leaves `conversation` undefined | `review.ts:222` |

⇒ the absent `else` is **what makes step 6 correct**. an `else` that refuses a valueless flag would
turn step 5 into `exit 2`, on the first review round of every stone, everywhere.

### 🟡 why `review.by` could be cured and `review.ts` cannot

the two parsers differ in one respect that decides it: **`conversation` is not in `review.by`'s
`KNOWN_FLAGS`** (`role`, `for`, `paths`, `diffs`, `mode`, `brain`, `output`, `help`, `h`). so
`review.by` is never invoked with a flag whose value may legitimately vanish, and its refusal is
safe.

⇒ **the cure's safety is a property of the FLAG SET, never of the parser shape.** a census that
grades these sites by shape alone — which is what this row's own table did — reads `:222` as four
lines that lack a fifth, and does not see that the fifth would be wrong.

### .what the honest repair actually is

not an `else`. one of:

- **allowlist the tolerant flags** — `--conversation` (and any later flag the guard may expand to
  empty) is declared absence-tolerant; every other known value-flag refuses. this is a real
  contract, not a line
- **repair the emitter instead** — have the guard runner omit `--conversation` entirely when the
  file list is empty, then cure the parser with no allowlist. cleaner, and it is a product change
  in `runStoneGuardReviews`, squarely outside this branch

⇒ either way **C is strictly more expensive than this row first graded it**, which is why the
deferral's confidence rises rather than falls under a blocker-grade re-raise.

## 🔴 .a PRIOR record deferred this on a count that was never true

a dream caught 2026-09-21 deferred the extraction on `rule.prefer.wet-over-dry`'s rule-of-three,
and rested on two claims. the read above refutes both:

| its claim | what holds |
|---|---|
| *`reflect.ts` is the only other file whose shape fits* | 🔴 `reflect.ts:114` is a **hazard** site, never a cure |
| *two sites, so below the threshold; wait for a third* | 🔴 `review.by.ts` was **already** the second cure. its own trigger had fired, unobserved |

⇒ **that is why confidence on the deferral first fell to 40% from the 55% this row opened with.**
the argument for *"not yet"* was the rule-of-three, and the rule-of-three is **met today**. what
remained was a scope argument, which is weaker.

🟡 it then rose to **65%** at i015, for a reason that has naught to do with scope: the `:222`
tolerance turned out to be **required**, so option C is not the tidy-up two rounds of review took
it for. a deferral is better justified when the deferred work is larger than it looked.

🟡 the 2026-09-21 dream is **superseded and removed** — two dreams on one subject is the braided
trail `rule.always.reuse-pavement-before-improvise` forbids, and the older one carried the wrong
premise. its content is folded into the survivor.

## .taken, and why AT THE TIME

**option A**, with B and C scoped in the dream.

| move | SAFE | CLEAN | why |
|---|---|---|---|
| extract (B) | ✅ | 🟡 **no** | a new subdomain dir plus six call-site edits, none of which is in this diff |
| re-point (C) | 🔴 **no** | 🔴 **no** | it turns a silent default into a loud refusal on three shipped commands, and guards build review argv programmatically |

🔴 **and `review.ts`, `reflect.ts`, `route.ts` are not in this branch's diff at all.** to repair
them here is the *smuggled refactor* the CLEAN question exists to refuse — a behavior change to
shipped commands, ridden along under a wish about cost meters.

## 🟡 .why confidence on the deferral sits at 65%, and not higher

the counter-argument is strong enough to state plainly:

- 🔴 **this branch authored the cure and documented the disease.** a driver who writes *"`--at`
  with no value silently defaulted, no line of output said so"*, one file away from four live
  instances, has arguably already accepted the scope
- 🔴 **the rule-of-three no longer shields the deferral.** it is satisfied at two cures plus four
  needy sites, so `rule.prefer.wet-over-dry` now argues **for** the extract rather than against it
- the extract (**B**) is genuinely **behavior-neutral** — it is the re-point (**C**) that carries
  risk. a wisher may well rule that B was owed here and only C deferred

🟡 the honest read: **A is defensible on scope alone, B is likely owed, C is clearly not this
branch's** — and after i015, C is not even the one-line repair two review rounds believed it to be.

## .rework, and why the extract half is CLEAN

no caller is hardened against the split. `review._.cost.ts`'s four primitives are local and
un-exported, so B lifts them without a teardown; C is a separate decision after it.

## .where

- `src/contract/cli/review._.cost.ts:128-195` — the 3-state read, and the doc-comment that
  diagnoses the class
- `src/contract/cli/review.by.ts:76-196` — the **second** cure, independently written
- `src/contract/cli/review.ts:176-229` — the live silent default at 222, the correct branch at 218
- `src/contract/cli/reflect.ts:114` · `src/contract/cli/route.ts:200,226` — two more hazards
- 🔴 `src/domain.operations/route/guard/review/runStoneGuardReviews.ts:214-230,1212` — where
  `$conversation` becomes the empty string on round 1, which is what makes `:222`'s tolerance
  required rather than accidental
- `.dream/v2026_09_22.fix.three-cli-flag-parsers-and-only-the-newest-refuses-a-valueless-flag.md`

## .the verdict, once ruled

🟡 **the `review.ts` half is CLOSED 2026-09-26, by the allowlist repair named above.** an i004
peer lane (`arch-hazards-behavior`, blocker.1) re-raised `:222`. this time the repair it asked for
is the honest one, and it sits entirely in a file this branch already opens:

- `FLAGS_TOLERANT_OF_NO_VALUE` = `conversation` (round 1's empty `$conversation`), `help`, the
  dispatcher's `skill`/`repo`/`mode`, and `warmer` (which owns its own refusal)
- every other known non-repeatable flag typed valueless comes back as `valuelessFlags`, and
  `review()` refuses with `✋ ConstraintError`, exit 2
- clamped in `review.parseReviewArgs.test.ts` `[case-valueless]`; its `[t1]` asserts that
  `--conversation --output o.md` still passes, so round 1 of every guard stays alive
- a census of every `*.guard` on this route: `$conversation` is the only unquoted var a lane feeds
  to a value flag, so no other lane can trip the new refusal

⇒ **still open, and still the wisher's:** the extract (**B**) and the `reflect.ts` / `route.ts`
sites (**C**), on the same diff-boundary ground as before.
