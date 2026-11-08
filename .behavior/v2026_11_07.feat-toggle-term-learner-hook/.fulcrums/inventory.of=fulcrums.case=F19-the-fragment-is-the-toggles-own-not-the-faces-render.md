# F19 — the fragment is the toggle's own, not the face's render

## .the fork

- **A.** `TERMS_HOOK_DECLARED.FRAGMENT` is the one place the toggle spells the command it writes and matches; the face (`learn.ts`) spells its own header and help
- **B.** lift the string into a shared leaf const that `learn.ts` and the toggle both read

## .taken — A

the two strings answer different questions. the fragment is the invocation the hook runs, and the toggle's match key for the entries already committed in opted-in repos. the face's lines are what it prints about itself. a rename of the face changes the skill name, which breaks the committed command in every repo however the string is shared; the cure then is a migration in the toggle, never a shared constant. B also edits the term-distill face, which the wish's nano bound keeps untouched.

## .rework — clean

one const module and two imports.

## .confidence — 80%, why not higher

a shared const would make a face rename fail loud in one place rather than two.

## .where

`src/domain.operations/learn/termsHook/TERMS_HOOK_DECLARED.ts` · `src/contract/cli/learn.ts:264,361`
