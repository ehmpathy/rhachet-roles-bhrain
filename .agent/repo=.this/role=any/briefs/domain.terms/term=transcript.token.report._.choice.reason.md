# domain.term.choice.reason: report

## .etymology
a report is a structured account of measured facts, handed to a reader who did not take the
measurements. that is the shape here: the tool reads the transcript so the human does not, and
hands back one object whose every leaf is a measurement or a rank of measurements.

chosen over:
- `summary` — a condensation of a text the reader could read in full; the report holds facts the
  transcript never states (a repaid sum, a rank), so it is not a condensation
- `analysis` — names the act, not the artifact it yields
- `result` — generic; every operation has a result

## .disputes
### dispute: report overloads the review subsystem's report — raised 2026-10-22 — status: RESOLVED (boundary-qualified)
- claim      = `rhx review` already writes a `*.report.md`, so a second `report` is an overload
- counter    = the two answer different questions within different boundaries — a review report
               grades an artifact against rules; this report measures a transcript's spend. one
               word, two boundaries, is the case `rule.require.boundary-qualified-terms` exists for
- resolution = this cluster is `transcript.token.report`; the review sense keeps its own boundary

## .evidence
- discovery: the vision's after-world renders one tree per invocation, headed by the transcript
  and closed by the proposal; that tree is the report rendered
- invariant: a corpus of N transcripts yields one report, whose `transcripts` lists each one read
  and whose `skipped` lists each one that was not (clamped in
  `getOneTokenSpendReport.integration.test.ts`)
- composes: `TokenSpendReport`, `getOneTokenSpendReport`
