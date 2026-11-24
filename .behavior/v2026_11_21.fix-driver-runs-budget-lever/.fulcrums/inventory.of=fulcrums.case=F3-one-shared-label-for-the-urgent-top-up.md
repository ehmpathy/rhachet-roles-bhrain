# F3 — one shared const for the urgent top-up label

## .the fork

- **a.** extract `increase budget — yours to spend` to one const, read by both `computeBlockRemedyGroups` and `asJudgeUrgentHaltLines`
- **b.** inline the same literal in the judge halt

## .taken, why

a. the defect is two surfaces that named two owners for one command. a shared const makes them agree by construction (`rule.require.single-source-of-truth-for-render`).

## .rework

clean: one new file, two imports.

## .confidence

95%.

## .where

`src/domain.operations/route/guard/review/peer/` (new const), `formatBlockRemedyGroups.ts:102,113`

## .verdict

settled: a.