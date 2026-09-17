# F001 — the shape is deliberate

- rework: clean
- status: open
- confidence: 80%

## the fork

the reviewer reads the exported shape as wrong. the alternative it implies would
couple the caller to an internal detail.

## taken, and why

kept the extant shape. the coupled read the alternative introduces costs more than the
tidiness it buys, and the rework is clean if the council rules otherwise.

## what would settle it

a second caller that needs the alternative shape.
