# F14 — get reports as a tree alone

## .the fork

- **A.** `get` renders the treestruct and exits 0 in both states, like its learner peers
- **B.** add `--output json`, or a distinct exit code per state

## .taken — A

the wish names three verbs and a default, nano. no caller in the wish or the vision reads the state by machine: the human reads it, and `enable`/`disable` are idempotent, so an automation that wants a state just sets it. a per-state exit code would make `get` exit non-zero on a healthy repo, which a hook or a `set -e` caller reads as a failure.

## .rework — clean

an additive flag; no extant output changes.

## .confidence — 85%, why not higher

a tool that audits many repos might want a json read; none has asked.

## .where

`src/contract/cli/learn.terms.hook.ts` `runGet`
