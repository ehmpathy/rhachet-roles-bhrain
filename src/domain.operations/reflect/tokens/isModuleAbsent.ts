/**
 * .what = whether an import failed because the module is not installed
 * .why = an absent brain package is a legitimate empty answer (its models render
 *        `unpriced`); a commonjs `require` reports `MODULE_NOT_FOUND`, while a native esm
 *        `import()` reports `ERR_MODULE_NOT_FOUND`, so both codes mean absent
 */
export const isModuleAbsent = (input: { error: unknown }): boolean =>
  input.error instanceof Error &&
  'code' in input.error &&
  (input.error.code === 'MODULE_NOT_FOUND' ||
    input.error.code === 'ERR_MODULE_NOT_FOUND');
