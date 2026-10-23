# domain.term: report

term.chosen   = report
term.kind     = noun                 # the whole answer one read of transcripts yields
term.boundary = transcript.token     # the spend of a transcript's tokens, call over call
term.synonyms.forbidden:
- summary
- analysis
- result

## .what
the whole answer `reflect.on.token.spend` yields for one selector: the transcripts it read, the
skips, the efficiency, the inventory, the repaid rows, the proposal, and the notes. one report per
read; a corpus of transcripts folds into one report, never a report per file.

## .refs
- src/domain.objects/Reflector/TokenSpendReport.ts
- src/domain.operations/reflect/tokens/getOneTokenSpendReport.ts
- src/domain.operations/reflect/tokens/asTokenSpendCorpus.ts
- src/domain.operations/reflect/tokens/formatTokenSpendTree.ts

## .reason
- `term=transcript.token.report._.choice.reason.md` — etymology, disputes, evidence
