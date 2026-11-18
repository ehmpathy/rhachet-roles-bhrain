---
case: F15
rework: dirty
ground: dirty
confidence: 0.65
status: open
owed: human
holds: [enroll-impl-arch-defects/i004/blocker.6, enroll-impl-behavior-intent/i004/nitpick.12]
lean: --reflect is checked by shape and matched to the fulcrum; a live check needs network and credentials, so it belongs to the radio, not the gate
verdict: null
---

# F15 — the `--reflect` ref is checked by shape, never by a live lookup

## .the fork

a sure misread owes a reflection, named by `--reflect <owner>/<repo>#<n>` on the dispute and by
`reflect:` in the fulcrum. today the ref is checked by shape, and the two must match. a made-up
`#999` passes.

- A: shape and match only, as shipped
- B: a live lookup of the issue on every dispute
- C: accept a local radio queue task id as the ref, so an offline driver can name a held push

## .taken, why

A. B puts the network and a github credential inside a gate that today runs offline, so a dispute
fails on an outage, and a driver with no credential cannot dispute at all. C couples the dispute
path to the dispatcher role's local queue format. both are real designs, and each changes what a
reflection IS, which is the human's call. the fake ref is visible in the diff and in the halt line,
which names it.

## .rework, why

dirty. B or C changes the `reflect` field's contract, and every reflect-owed fulcrum, the linter,
and the halt render read that field.

## .confidence, why low

a check a driver can pass with a fake value is a weak check, and the reviewer is right that the
honest driver can be stuck on auth. 65%.

## .where

`src/domain.operations/route/fulcrum/assertFulcrumFitsDispute.ts` ·
`src/domain.operations/route/fulcrum/asFulcrumFrontmatter.ts` (the `reflect` shape).

## .verdict

open. owed to the human at the PR.
