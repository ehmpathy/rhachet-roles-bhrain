import { asRuleName } from './asRuleName';

/**
 * .what = each rule path, keyed by its rule name
 * .why = an update with no usable targetPath is bound to a prior rule by name
 * .note = where two paths share a name, the later one wins (Map construction order)
 */
export const asRulesByName = (input: {
  rulePaths: string[];
}): Map<string, string> =>
  new Map<string, string>(
    input.rulePaths.map((rule) => [asRuleName({ rulePath: rule }), rule]),
  );
