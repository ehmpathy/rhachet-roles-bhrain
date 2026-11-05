# F10 — a transcript is read whole per file, not streamed line by line

## .the fork

the behavior-intent reviewer (r010, concern 7) noted the vision says a transcript is streamed,
while `getTranscriptCallsFromFile` calls `fs.readFileSync` on each file. two choices:

- **A — stream now**: a `readline` pass that folds records into calls as it reads, so one file's
  peak memory is one line plus the call list
- **B — keep the whole-file read**: one file is held at a time, then dropped; catch a dream

## .taken — B, and why at the time

- memory is bounded per FILE, never per corpus: the per-file loop holds one transcript's text,
  folds it to calls, and releases it before the next — a 212-file corpus costs one file's peak
- the largest measured transcript (the 1,000-call session this route was born from) is tens of MB;
  node holds that with room to spare
- A changes the read from sync to async through `asTranscriptRecords`, whose torn-tail rule
  (skip a half line only at the END) needs the last-line lookahead a stream makes awkward — a real
  rework of the most-tested leaf, for no failure observed today

## .rework — clean

the read is one private function; its contract (`{ calls, partialLinesSkipped }`) does not change.

## .confidence — 70%, and why it is low

the vision used the word "stream", so the wisher may read B as a dropped promise. a transcript
past a few hundred MB would make B fail, and no such file was measured.

## .where

- `src/domain.operations/reflect/tokens/getTranscriptCallsFromFile.ts`

## .verdict

reversed to A in i002. the repo-rules reviewer held that B deferred a fix its own dream called safe
and clean, which `rule.forbid.lazy-review-deferrals` does not permit. the read now streams through
`readline` into a line fold and a call fold; a torn mid-file line halts with `line: N of M` once
the stream ends, and a torn tail is counted. the dream is spent and removed.
