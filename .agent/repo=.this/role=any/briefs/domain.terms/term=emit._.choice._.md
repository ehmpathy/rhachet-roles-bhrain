# domain.term: emit

term.chosen   = emit
term.kind     = noun, verb
term.boundary = —          # a ROOT. it names a cli surface, not a subdomain concept
term.synonyms.forbidden:
- output
- print
- render
- message

## .what

what a command hands back to whoever invoked it — the bytes on `stdout`, the bytes on
`stderr`, or both together.

it is **both a noun and a verb**, and the pair is the point: a command *emits* an emit.

## .the two streams are ONE emit

`stdout` and `stderr` are the two channels an emit travels on. the word covers both, so
a operation that works on either takes an `emit`, never a `stdout`.

⚠️ **the split is guidance-vs-evidence, never success-vs-failure.** a tree the driver must
READ to act goes to stdout — even on a halt. artifact detail that justifies a verdict goes
to stderr. `setStoneAsPassed` supplies stdout-only for the review.self gate, the entrance
gate, and the exit gate; only the judge-failure branch supplies stderr.

## .refs

- `src/domain.objects/Driver/ContextCliEmit.ts` — the dobj
- `src/domain.operations/route/guard/genContextCliEmit.ts`
- `src/domain.operations/route/formatRouteStoneEmit.ts`
- `src/domain.operations/route/stones/genStoneGuardBlockedEmit.ts`
- `src/domain.operations/route/__test_assets__/asStableGuardEmit.ts`

## .reason

- `term=emit._.choice.reason.md`
