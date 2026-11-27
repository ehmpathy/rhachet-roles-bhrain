/**
 * .what = fill each `$NAME` in a template with its value
 * .why = a stone is read raw by `route.drive`, so values known at init (role, slug, paths)
 *        are written into it once, at findsert
 * .note = only UPPER_SNAKE names held in `vars` are replaced; `$route` and any other name
 *         stays as written, so a guard's runtime `$route` survives
 */
export const asTemplateFilled = (input: {
  template: string;
  vars: Record<string, string>;
}): string =>
  input.template.replace(/\$([A-Z][A-Z0-9_]*)/g, (whole, name: string) =>
    name in input.vars ? input.vars[name]! : whole,
  );
