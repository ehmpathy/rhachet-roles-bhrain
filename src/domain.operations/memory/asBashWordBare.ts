/**
 * .what = a shell word with its quotes, brace and paren marks, escape, and dir stripped
 * .why = `"cp`, `$(cp`, `<(cp`, `{cp`, `\cp`, and `/bin/cp` all name cp; every leaf
 *        that asks which command a word names asks it here, so no two disagree
 */
export const asBashWordBare = (input: { word: string }): string =>
  input.word
    .replace(/^[\\(<>"'{!$`]+/, '')
    .replace(/["');}`]+$/, '')
    .replace(/^.*\//, '');
