# F229 — the repo-rules r001 holds that trade a cosmetic for a ripple

## .the fork

5.3 i002 r001 `repo-rules` raised 24 nitpicks and no blockers. most are repaired, or are answered by
a fulcrum already on record. the rows below are the ones this round holds on its own. each could be
cured now, but only through a change that spreads past this diff: a snapshot sweep, a rename of a
published term, or a concurrency change in the judge runner.

two answers per row: **(a)** repair it in this round · **(b)** hold it, record the tradeoff, and catch
a dream where the work is real

## .taken

**(b)** for every row below. not one of them ships a harm a user would meet. all are `better`.

| global | concern | why it holds |
|---|---|---|
| nitpick.2 | the partition plan and the coverage read render partition rows by two paths | the route form `+ N common` sits in ~45 snapshot lines; the review form says `common targets`. one shared render is a snapshot sweep across two surfaces. caught as a dream |
| nitpick.5 | `new` as a changeKind value, where the glyph is `+` | `+` is the RENDER of the type word `new`. the type speaks a word and the tree speaks a glyph, the same split the glyph catalog draws. no synonym: one concept, one word, one glyph |
| nitpick.6 | `process.chdir` into a temp dir in `enumFilesFromGlob [case8]` | the defect under test lives in globby, which stats ignore entries against the PROCESS cwd, never the glob cwd. only a real chdir reproduces the cli's condition; from the jest root the stat met ENOENT and the defect hid. the temp dir is its own git root, and cwd is restored in `finally`. the rule governs where prod work runs, never a test that must stand where the cli stands |
| nitpick.15 | the `--as inflight` ack renders its header inline | ~~held~~ **reversed at i003, repaired** (i003 r001 blocker.2). the hold was wrong: `FormatInput` is a union, so an `inflight` arm costs one member and one `else if`, never a branch per emit. `setStoneAsInflight` now renders through `formatRouteStoneEmit`, byte for byte as before |
| nitpick.16 | the judge runner awaits judges in series | the reviewer's own grade: a guard holds one or two judges, so the wall-time win is small. a pour reorders the judge log and the tree render, which then must sort by index — real work on a seam the guard snapshots pin. caught as a dream |
| nitpick.18 | `case8` snaps stdout only for its halt and ack steps | an acceptance resnap of the absorption suite, the longest in the repo, for two snapshots of an empty stream. caught with nitpick.2's sweep, which re-pins the same suites |
| nitpick.20 (second half) | the `census.review-shared-prefix` skill name | the skill is a census OF the review's shared prefix: the name reads `$verb.$subject`, which is the skill convention. the term's boundary governs the word `census`, never the subject a skill counts |
| nitpick.21 | `review.seam` boundary head | the seam is the review prompt's cache seam. `prompt.cache.seam` is the cluster; `getOneCharsByCacheSeam` names the cluster's word, under the domain dir that composes it |
| nitpick.22 | `run`/`tree`/`grove` itemized per position where the cache grades are not | a breadth position names the container it spans (`git.tree`, `git.grove`) — a real domain noun, used across three surfaces. a grade position is one adjective of one dobj |

## .rework

**clean**, row by row. each is a rename, a render merge, or one `Promise.all`. none ripples into a
contract a caller hardened against, save the snapshot sweep, which is mechanical.

## .confidence

🟡 **80%** — the doubt is nitpick.2 and nitpick.17: a reader may count two renders as a defect today
rather than a sweep deferred. the rest rest on a stated convention.

## .where

`src/contract/cli/route.ts` · `src/domain.operations/route/judges/` ·
`src/domain.operations/route/guard/partition/asRouteGuardPartitionTreeLines.ts` ·
`.agent/repo=.this/role=any/briefs/domain.terms/`

## .verdict

unruled — awaits the council.
