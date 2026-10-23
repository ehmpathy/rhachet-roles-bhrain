# F278 — a partition with no snapshot has no blemish

- raised 2026-10-12, by `ergo-snapshot-visual-blemishes` (nitpick.19), at 5.3 i004
- rework: **clean** — no change is owed
- status: 🟡 **BEST-GUESSED — disputed; the concern names no defect**
- confidence: **95%**

## .the fork, stated fairly

the `agent` partition raised one nitpick: it holds no `.snap` files, so the rule's subject is absent.

| option | the claim |
|---|---|
| **A — dispute it** | an absent subject is a fact about the partition, not a defect. no edit could close it |
| **B — concede it** | to concede is to promise a fix, and there is none to make |

## .taken, and why

**A.** the concern states itself that the rule's subject is absent from the partition. a concession
would commit the driver to a repair that does not exist (`rule.forbid.suppression-of-undeclared-concerns`:
a declaration must say what it holds). the partition's files are actor config and briefs, which
carry no snapshot.

## .rework, and why

**clean.** naught to change.

## .confidence, and why it is not higher

it is as high as it reads.

## .where

`.agent/.actors/**` (partition `agent`)

## .verdict

— (awaits the council)
