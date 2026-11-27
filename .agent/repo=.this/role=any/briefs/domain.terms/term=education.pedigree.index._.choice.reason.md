# domain.term.reason: education.pedigree.index

## .etymology

an index is a list of pointers into a body, one row per member, no narrative about any one. that
is exactly the pedigree root: one row per entry, the entry itself read on demand. the librarian's
`rule.require.catalog-is-an-index` uses the same word for the same shape, so the pedigree speaks
the repo's own vocabulary.

rejected:
- `root` — names the file's place in the cluster (`._.md`), not what it holds
- `summary` — implies prose that condenses the entries; the index holds rows, never a digest
- `toc` — a table of contents orders one document's sections; the entries are separate briefs

## .evidence

- the index boots at `say` and the entries at `ref` (`asBootClaim`, `getOnePedigreeStamp`): the
  boot reads the index every session and an entry only when a row sends it there
- `asPedigreeIndexMarkdown` renders the index whole from every entry; `[case7][t2]` of
  `educationJourney.integration.test.ts` proves the graduate judge holds when the index lacks a row

## .invariants

- the index holds one row per entry the role holds, no more, no fewer
- a re-stamp rebuilds the index whole; it never appends
