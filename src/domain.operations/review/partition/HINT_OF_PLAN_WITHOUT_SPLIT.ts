import { CLAUSE_OF_PARTITION_UNDER_GUARD } from './CLAUSE_OF_PARTITION_UNDER_GUARD';

/**
 * .what = the hint a `--mode plan` run with no split to preview prints
 * .why = two checks refuse it — the cli's early flag check and stepReview's late check —
 *        and both must print the same hint, so it is declared once, with the guard clause
 *        every `--partition` hint carries
 */
export const HINT_OF_PLAN_WITHOUT_SPLIT = `declare one or more with --partition '<slug>=<globs>' ${CLAUSE_OF_PARTITION_UNDER_GUARD}`;
