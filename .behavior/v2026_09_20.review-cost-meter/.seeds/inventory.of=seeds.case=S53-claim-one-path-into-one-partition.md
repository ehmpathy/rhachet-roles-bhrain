# S53 — `--claim <path> --into <slug>` is the append form; all four partition repairs go ahead

- said 2026-10-07, as the choice between a `--claim … --into …` form and `+=` for S51's append

## .said

> --claim <path> --into <slug> form is better; yes on all 1. Add one path without re-declaring
> every partition. … 2. Print the repair as comma lists, not brace syntax. … 3. Give .agent/** and
> the briefs their own partition. … 4. Drop the stale glob route/guard/round/__snapshots__/**.

## .settled

- the append form is `--claim <path|glob> --into <slug>`, never `+=`. it names the act (claim a
  file for a partition) where `+=` names an operator; the stored set is still written back whole
- a printed repair renders globs as comma lists, never brace sets
- the 5.1 guard's set gains named domain partitions for `.agent/**` and the briefs (S52), and
  drops the glob that matches no file

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F172-a-repeated-partition-slug-merges-and-plus-equals-is-refused.md`
