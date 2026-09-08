# domain.term: scope

term.chosen   = scope
term.kind     = noun
term.boundary = review        # the set of files ONE review reads
term.synonyms.forbidden:
- selection
- coverage
- surface
- corpus

## .what

**scope** is the declared set of files a single review reads — its three buckets, verbatim from
the contract:

```ts
scope: {
  ruleFiles: string[];    // the rubric
  refFiles: string[];     // the context it leans on
  targetFiles: string[];  // the work under judgement
}
```

⚠️ **scope is the INPUT set, never the verdict's reach.** a reviewer may only judge what its scope
carried; a file outside it was not examined, and an unexamined file is indistinguishable from a
clean one.

⇒ the scope is **bounded by flags** (`--diffs`, `--paths-with`, `--paths-wout`, `--join`) and
**reported by artifact** (`input.scope.json`, `input.scope.debug.json`) plus the stderr scope block.

## .refs

where the term composes declared operations and artifacts:
- src/domain.operations/review/writeInputArtifacts.ts:20   # the declared shape
- src/domain.operations/review/genReviewInputStdout.ts      # the stderr scope block
- .log/bhrain/review/$ts/input.scope.json                   # the emitted record
- .log/bhrain/review/$ts/input.scope.debug.json             # what each glob matched

## .reason

see the ref-level cluster beside this choice:
- `term=review.scope._.choice.reason.md` — etymology, the rejected synonyms, and the measured
  round that settled what the word must carry
