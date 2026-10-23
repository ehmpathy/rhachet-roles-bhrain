# fulcrum F46 — the review CLI refuses in the repo's owl dialect, which names no error class

- rework = 🔴 **dirty** — every refusal of `rhx review` and `rhx review._.cost`, and their snapshots
- status = 🟡 **DISPUTED 2026-09-26 — option B, defer + dream**
- confidence = 🟡 **80%**
- raised.by = peer lane `mech-failhides`, blocker.1, round hash `f9989f17260b48b058`

## .the fork

`rule.require.qualified-error-headers` (ehmpathy/mechanic) asks every human-read error to open
`✋ ConstraintError:` or `💥 MalfunctionError:`. the review CLI opens its refusals two other ways:

| surface | opener | on main? |
|---|---|---|
| `stepReview` — five refusals | `🦉 woah there` then `✋ <headline>` | ✅ yes, byte for byte |
| `review.ts` — flag validation | `error: <what>` then `run with --help for usage` | ✅ yes (`--rules`, `--optional`) |
| `emitReviewRefusal` | the `stepReview` frame, FOLDED — no byte changed | new file, extant bytes |
| `review.ts` — `--polluters`, `--warmer` | `error: <what>` | new lines, extant dialect |
| `review._.cost.ts` | `🦉 <headline>` + tree | new surface, extant dialect |

### A — convert the branch-new refusals only

cheap. 🔴 and it leaves one CLI in two dialects: `--rules` refuses `error:`, `--polluters` refuses
`✋ ConstraintError:`. a reader who meets both learns the opener means naught.

### B — defer the whole conversion, catch a dream (taken)

the rule's value is ONE vocabulary. that is a sweep of every refusal the review CLI owns, plus
every blackbox snapshot that pins one — surfaces this wish never named. the dream carries the
shape: change the frame once in `emitReviewRefusal`, route `review.ts`'s `error:` lines through a
peer of it, resnap.

### C — convert the whole CLI now

the right end state. 🔴 it smuggles a CLI-wide surface change into a cost-meter branch
(`rule.prefer.scouts-honor`'s bound: *"a large or out-of-scope cleanup smuggled into an unrelated
change = blocker"*).

## 🟡 .why 80%, not higher

- the `review._.cost` refusals are this branch's own surface, so A's split would at least be
  per-command rather than per-flag. a council may prefer that
- the severity is `better` on the harm test: the glyph `✋` already tells a reader they must act,
  and every refusal names its fix. no nameable harm ships

## .where

- `src/domain.operations/review/emitReviewRefusal.ts`
- `src/contract/cli/review.ts`, `src/contract/cli/review._.cost.ts`
- `src/contract/cli/review.by.ts`, `src/contract/cli/reflect.ts` — the terminal
  `BadRequestError` catches, and the usage refusals that exit 1
- `src/domain.operations/brain/getOneBrainChoicePinned.ts` — throws `BadRequestError`
- `src/domain.operations/review/grove/genReviewGroveStdout.ts`,
  `genReviewGroveReport.ts` — the unreadable-tree rows open with a bare `💥`
- the dream: `.dream/v2026_09_26.fix.review-cli-refusals-name-their-error-class.md`

## .verdict

✅ **REVERSED + BUILT** — the render dialect at i004 (see the summary row); the throw class on
2026-10-05, conceded to peer lane r003 (nitpick.2).
`helpful-errors` 1.7.5 ships `ConstraintError` (a `BadRequestError` subclass whose message opens
`✋ ConstraintError: `), so the class half costs no dialect split: every branch-new throw in
`brain/`, `getAllFileChangesFromRange`, `asGuardCmdFreeOfNpx`, and
`asRouteGuardReviewPeerPathHash` now throws `ConstraintError`, and `asConstraintErrorHeader` /
`asWarmerRefusalBody` strip either lead so no header doubles. extant `catch BadRequestError`
sites still hold, by subclass.
