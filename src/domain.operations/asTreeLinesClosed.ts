/**
 * .what = closes a tree whose last row was cut: its last top-level `├─` becomes `└─`, and the
 *         `│` rail beneath it becomes blank
 * .why = a refusal tree once closed on its hint row. with the hint moved to its own block, the
 *        row above it is now the last, and a `├─` there would promise a peer that never comes
 *
 * .note = it reads a tree at the 3-space base indent every refusal frame draws (`   ├─`)
 */
export const asTreeLinesClosed = (input: { lines: string[] }): string[] => {
  // the last top-level row; none means no tree to close
  const indexLast = input.lines.reduce(
    (found, line, index) =>
      line.startsWith('   ├─') || line.startsWith('   └─') ? index : found,
    -1,
  );
  if (indexLast === -1) return input.lines;

  // flip that row's connector, and blank the rail of each row beneath it
  return input.lines.map((line, index) => {
    if (index < indexLast) return line;
    if (index === indexLast) return line.replace(/^ {3}├─/, '   └─');
    return line.replace(/^ {3}│/, '    ');
  });
};
