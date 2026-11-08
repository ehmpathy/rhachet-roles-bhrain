# F17 — the settings operations stay at their leaf

## .the fork

- **A.** the target pick, the read, the write, and the hold live under `learn/termsHook/`, named for the toggle
- **B.** lift them to a generic claude-settings domain with a `subject` label and an `isMatch` predicate

## .taken — A

the toggle is the one ts caller that writes claude settings in this repo. the other two sites the reviewer names are a bash init (`init.claude.status-line.sh`) and a test helper, neither of which can import a ts domain operation. `rule.prefer.most-common-denominator` places an operation at its leaf until a second caller of its own kind needs it; the wish's nano bound keeps the lift out of this pr.

## .rework — clean

a rename and a move; the only importer is `setTermsHookToggle`.

## .confidence — 80%, why not higher

a second settings writer in ts is plausible (the subconscious term distill), and it would make the lift owed then.

## .where

`src/domain.operations/learn/termsHook/`
