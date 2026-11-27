/**
 * .what = the value of a `$key=$value` dir name, or null when the name holds another key
 * .why = rhachet names its role dirs by coordinate (`repo=ehmpathy`, `role=mechanic`); one
 *        parse reads them all
 */
export const asCoordinateValue = (input: {
  name: string;
  key: string;
}): string | null => {
  const prefix = `${input.key}=`;
  if (!input.name.startsWith(prefix)) return null;
  return input.name.slice(prefix.length) || null;
};
