/**
 * .what = the outer rhachet dispatcher's own flags, forwarded verbatim into a skill's argv
 * .why = each review command must pass these through rather than refuse them as unknown.
 *        the set is a fact the dispatcher owns, so it is declared once here; a copy per
 *        command would refuse a new dispatcher flag until every copy was edited
 */
export const FLAGS_OF_DISPATCHER: ReadonlySet<string> = new Set([
  'skill',
  'repo',
  'mode',
]);
