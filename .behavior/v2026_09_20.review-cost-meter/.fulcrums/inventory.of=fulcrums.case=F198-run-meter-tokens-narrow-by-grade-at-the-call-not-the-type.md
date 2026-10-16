# F198 — run-meter tokens narrow by grade at the call, not yet in the type

- raised 2026-10-09, from i034 r031 nitpick.1 `[nitpick][better]`: `getOneReviewTokensOfRuns` sums
  `run.tokens ?? TOKENS_NIL`, so a caller that passes unmetered runs zeroes them into the sum; the
  reviewer asks for a union on `grade` so `tokens` is non-null exactly where `grade === 'metered'`
- rework: clean
- status: 🟡 **BEST-GUESSED — disputed; overrule it to land the union now**
- confidence: **75%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — a union on `grade` now** | `ReviewRunMeter` becomes `metered \| refused \| unknown`, `getAllRunsMetered` returns the metered arm, the sum's input narrows, `?? TOKENS_NIL` is deleted |
| **B — filter at every caller now, union later** | both callers (`--of tree` and `--of grove`) pass `getAllRunsMetered({ runs })`, so the drift is closed today; the type follows when the meter's shape next moves |

## .taken, and why

**B.** the drift the reviewer named — the grove summed every run — is closed: the grove headline
and its rollup both read `getAllRunsMetered({ runs })` (`genReviewGroveReport.ts`), the same filter
the tree already used. what remains is that the compiler does not yet enforce it. the union touches
every `ReviewRunMeter` reader and its json shape, which `--of run --json` publishes.

## .rework, and why

**clean.** a type narrow with no behavior change: every call site already passes metered runs, so
the union adds a compile-time guard and moves no figure.

## .confidence, and why it is not higher

a third caller of the sum that forgets the filter would reopen the drift with no compile error.

## .where

`src/domain.operations/review/meter/getOneReviewTokensOfRuns.ts` ·
`src/domain.operations/review/meter/getAllRunsMetered.ts` ·
`src/domain.operations/review/grove/genReviewGroveReport.ts`

## .verdict

(open)
