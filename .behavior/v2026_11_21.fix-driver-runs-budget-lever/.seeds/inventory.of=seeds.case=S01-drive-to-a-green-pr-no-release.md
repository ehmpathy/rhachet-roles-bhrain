# S01 — drive to a green pr, no release

## .said

> 1.vision is approved. drive on to a green pr; no release, no --apply.

## .settled

- the route ends at an open pr whose ci is green
- no `rhx git.release --apply`, no `--into prod`, no automerge
- a `--watch` of ci is in bounds; it applies no change

## .landed

| where | what |
|---|---|
| route end | open pr, ci watched to green, no release step |
