/**
 * .what = the refusal block of a cli output, from its ✋ header to the end
 * .why = a refusal snapshot pins only the refusal; the preamble above it carries a spinner frame
 *        and an elapsed counter. fails loud where no ✋ header renders, so a refusal that never
 *        printed cannot pass — `hint` names the likely cause for that suite
 */
export const asRefusalBlock = (input: {
  output: string;
  hint: string;
}): string => {
  const start = input.output.indexOf('✋');
  if (start === -1)
    throw new Error(`no ✋ refusal header in output. hint: ${input.hint}`);
  return input.output.slice(start);
};
