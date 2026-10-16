# F208 — `--at` names the root of the breadth asked for

- raised 2026-10-10, from i035 r030 nitpick.2 `[nitpick][better]`: `--at` is a run dir at
  `--of run`, a tree dir at `--of tree`, and a grove root at `--of grove`, whose default is the
  parent of cwd
- rework: clean
- status: 🟡 **BEST-GUESSED — disputed**
- confidence: **65%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — a flag per breadth, or a per-breadth map** | each sense declared once; the help, refusal, and dispatch read one source |
| **B — one sense: where the breadth is read from** | `--of` names WHAT is priced; `--at` names WHERE it sits. a run, a tree, and a grove are each one place, and the default is "the one you stand in" for each |

## .taken, and why

**B.** the flag carries one sense across the axis: the location of what `--of` names. the grove
default is the parent of cwd because a tree sits inside a grove, which is the same "the one you
stand in" rule read one level up. `isRunDirGivenToTreeBreadth` refuses the one confusion this
leaves open, with the fix printed.

## .rework, and why

**clean.** a map beside `DESCRIPTION_OF_BREADTH`, and help copy.

## .confidence, and why it is not higher

a per-breadth map would make the defaults readable in one place, which the help copy does today
only in prose.

## .where

`src/contract/cli/review._.cost.ts`

## .verdict

(open)
