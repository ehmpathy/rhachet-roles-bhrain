/**
 * .what = the clause that names the guard-side twin of `--partition`
 * .why = a lane run by a guard declares its partitions once per route, never per hand-run;
 *        every hint that names `--partition` appends this one clause, so the command it
 *        points at cannot drift between the hints (rule.forbid.duplicate-format-tree-operations)
 */
export const CLAUSE_OF_PARTITION_UNDER_GUARD =
  '(under a guard, rhx route.guard.partition --for review --peer @all)';
