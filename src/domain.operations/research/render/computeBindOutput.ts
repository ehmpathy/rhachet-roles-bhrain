/**
 * .what = compute bind confirmation output
 * .why = confirm branch <-> research association to user
 */
export const computeBindOutput = (input: {
  branchName: string;
  researchName: string;
}): string => {
  const dim = '\x1b[2m';
  const reset = '\x1b[0m';

  return [
    `✨ we'll lay the stage,`,
    `   ├─ branch ${input.branchName} <-> research ${input.researchName}`,
    `   └─ ${dim}branch bound to research, to boot via hooks${reset}`,
  ].join('\n');
};
