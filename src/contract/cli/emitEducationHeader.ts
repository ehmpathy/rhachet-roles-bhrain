/**
 * .what = emit the header of an education face: the owl's vibe, a blank, then the scroll and the command
 * .why = every learner face opens the same way (`learn.terms.hook` emitHeader)
 */
export const emitEducationHeader = (input: {
  vibe: string;
  command: string;
}): void => {
  console.log(`🦉 ${input.vibe}`);
  console.log('');
  console.log(`📜 ${input.command}`);
};
