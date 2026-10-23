# F7 — read the versioned anthropic specs via a deep import

## .the fork

`rhachet/brains` discovery returns only the version-less anthropic aliases (`claude/opus`). a
transcript names an exact model (`claude-opus-4-5-20251101`). three choices:

- **A — price by the alias** — map `claude-opus-*` to `claude/opus`, whatever version it pins
- **B — deep import `CONFIG_BY_ATOM_SLUG`** from the package's internal dist path, keep only the
  versioned slugs, and price by an exact slug match
- **C — leave every model `unpriced`** until the package exports versioned atoms

## .taken — B, and why at the time

- A misprices silently: the alias pins opus 4.5, so an opus 5.5 call would read 4.5 rates
  ($5 input against $4) with no signal — a confident wrong answer, worse than `unpriced`
- C abandons price as primary for every transcript, though the exact specs sit installed
- B prices the versions the package declares, leaves the rest `unpriced`, and an absent package
  is caught (`MODULE_NOT_FOUND` only) and degrades to `unpriced`

## .rework — clean

one function, `getAnthropicAtomsVersioned`, in `getTokenRatesByModel.ts`. once the package lists
versioned atoms (the reseed dream), delete the function; `asTokenRatesByModel` is untouched.

## .confidence — 75%, and why it is low

a deep import of an internal path is not a published contract; a minor release of the package may
move it, and the failure then is a thrown import error rather than `MODULE_NOT_FOUND`, so it fails
loud rather than silent — acceptable, but a reviewer may prefer C until the upstream fix ships.

## .where

- `src/domain.operations/reflect/tokens/getTokenRatesByModel.ts`
- `src/domain.operations/reflect/tokens/asTokenRatesByModel.test.ts` — case2 clamps that an alias
  never stands in for a version
- `dreams/v2026_10_21.reseed.anthropic-brain-specs-for-5x-models.md` — the upstream fix

## .verdict

open.
