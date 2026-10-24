# F29 — the main-era gitignore unit suites stay where they are filed

- **the fork:** `findsertReview{Peer,Self}Gitignore.test.ts` do real fs i/o under a `.test.ts`
  name. (a) move them to `.integration.test.ts` here · (b) leave them, catch a dream
- **taken:** (b). both files sit on `origin/main` with the fs i/o already in them. this pr touched
  each for one literal (`/nonexistent` → `/rhachet-test-root-never-made`, since `/nonexistent`
  exists on this box) and one label (`[case8]` ENOTDIR → EEXIST). each already has an
  `.integration.test.ts` twin with near-identical cases, so a move is a merge of two suites, not
  a rename — a change past this wish
- **rework:** clean — a merge of each pair, caught as a dream with its shape
- **confidence: 85%**
- **where:** `src/domain.operations/route/gitignore/findsertReview{Peer,Self}Gitignore.test.ts`
