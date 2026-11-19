# F12: the cwd fold keeps its union across `&&`

## .the fork

the cwd fold reads each simple command apart from the separator before it, so it holds every cwd the shell may have: a `cd` adds to the set, never replaces it. after `cd M && cat a.md && cd /repo && echo x > out.txt`, the set still holds M, and the write blocks as a write into memory though it lands in /repo. carry the separators into the fold now, so a `cd` after `&&` replaces the cwd, or catch it as a dream?

## .taken: catch it as a dream

- the union errs one way only: toward a block. no write into memory passes through it, so it holds the wish's one hard term
- the cure reaches the segment splitter, which every grader reads; a separator-aware fold must also know that `&&` after a failed `cd` stops the chain, `||` runs on failure, and `;` runs on either, so the replace is sound only for `&&`
- the false block names its path and act, so a human who meets it reads why; it is rare: a read inside memory, then a `cd` out, then a relative write, in one command

## .rework: clean

the splitter returns each segment with the separator before it; the fold replaces the set on `&&` after a `cd`, and keeps the union for `||`, `;`, `&`, and `|`. one new table of rows; no contract leaves the memory dir.

## .confidence: 85%

the risk is a reader who meets the false block often enough to read the guard as noise; the evidence says the shape is rare.

## .where

`src/domain.operations/memory/getAllBashSegmentScenes.ts`, `getAllBashCommandSegments.ts`.

## .verdict

open for the human.
