/**
 * .what = the catalog ids on a tier's model line, newest first
 * .why = a tier reaches the newest model of its line. when that model has no host that keeps
 *        the test promises, the next newest is the one a test can use
 *
 * .note = a model dated for withdrawal is left out, as the brains package leaves it out
 */
export const getAllTierModelIdsNewestFirst = (input: {
  catalog: { id: string; created: number; expiration_date: string | null }[];
  line: RegExp;
}): string[] =>
  input.catalog
    .filter((model) => input.line.test(model.id))
    .filter((model) => model.expiration_date === null)
    .sort((a, b) => b.created - a.created)
    .map((model) => model.id);
