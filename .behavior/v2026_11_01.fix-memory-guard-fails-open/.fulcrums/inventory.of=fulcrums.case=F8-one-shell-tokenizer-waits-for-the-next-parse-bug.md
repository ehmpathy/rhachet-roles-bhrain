# F8: one shell tokenizer waits for the next parse bug

## .the fork

five leaves read shell text, each by its own rule: the quote mask and separators, the verb's word split, the destination operand, the cwd fold, the word-char regexes. build one tokenizer (quote, escape, `$'…'`, operators) that they all read now, or keep the leaves and catch the tokenizer as a dream?

## .taken: keep the leaves, catch the dream

- the quote and escape grammar already lives in one place, `asBashQuotesMasked`, which both the segment split and the reader exemption read; the word charset lives in `BASH_WORD_CHAR`
- each seam fails safe, so a parse gap blocks rather than passes:
  - the reader exemption: an operator left after the mask voids it
  - the memory carry: a memory path named anywhere reaches every part of the command (F10)
  - the cwd fold: it keeps every cwd the command may hold, and an unknown one leaves a relative redirect unplaced, which blocks beside memory
- a tokenizer is a rewrite of every leaf and its tests, in a round whose wish is a fail-open fix; `rule.prefer.wet-over-dry` waits for a parse bug that a fail-safe seam cannot absorb
- the dream carries the shape: `.dream/v2026_11_01.lift.one-shell-tokenizer-for-memory-guard.md`

## .rework: clean

a new leaf and five callers that read it; each leaf's case table is its clamp.

## .confidence: 85%

the arch lane itself grades it a follow-up; each round's parse gaps were cured by a seam made fail-safe, not a tokenizer. the risk is a gap at a seam that still grades exactly: a relative redirect placed at a known cwd.

## .where

`src/domain.operations/memory/`.

## .verdict

open for the human.
