# domain.term: footer

```
term.chosen   = footer
term.kind     = noun
term.boundary = artifact
term.synonyms.forbidden:
- summary
- trailer
- tail
- outcome-block
```

## .what

a **footer** is a terminal branch of an artifact tree — a block appended **below** the artifact's
stream buckets that reports an outcome about the run rather than output from it.

an artifact admits exactly **two** kinds, and both may fire on one artifact:

| kind | it reports | it fires when |
|---|---|---|
| **passage** | why the run was refused, and its exit code | the exit code is non-zero |
| **tally** | the blocker and nitpick counts, and who counted them | a readable verdict was rendered |

## 🔴 .the invariant

> **an artifact tree admits exactly ONE terminal branch, so at most one footer carries `└─`.**

a footer therefore does **not** own its marker — it **derives** it from whether another footer
follows. and the child indent moves with the marker: a `├─` parent carries `│  ` children, a `└─`
parent carries `   `.

⇒ **which footer lands last is one decision, so it lives in one operation.** that is why
`formatArtifactFooters` takes both footers together and returns the whole block, rather than one
operation per kind that each render alone.

## .refs

- `src/domain.operations/route/guard/tree/formatArtifactFooters.ts` — the one writer
- `src/domain.operations/route/guard/review/runStoneGuardReviews.ts` — renders both kinds
- `src/domain.operations/route/judges/runStoneGuardJudges.ts` — renders passage only (`tally: null`)
- `src/domain.operations/route/guard/tree/formatArtifactStreamBuckets.ts` — its twin, for what sits **above** a footer

## .reason

- `term=artifact.footer._.choice.reason.md`
