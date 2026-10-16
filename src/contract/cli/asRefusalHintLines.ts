import { asDidYouKnowLines } from '@src/domain.operations/asDidYouKnowLines';
import { asTreeLinesClosed } from '@src/domain.operations/asTreeLinesClosed';

/**
 * .what = a flag refusal's detail tree, with its hint placed where a hint belongs
 * .why = a hint is a next move, so it renders as its own `✨ did you know?` block after the
 *        tree, never as a `hint:` leaf inside it (rule.require.coconut-hints). a hint that
 *        already opens on `fix: ` stays the closed leaf of the tree, since it is the
 *        paste-ready correction to the fault the tree names
 */
export const asRefusalHintLines = (input: {
  lines: string[];
  hint: string;
}): string[] =>
  input.hint.startsWith('fix: ')
    ? [...input.lines, `   └─ ${input.hint}`]
    : [
        ...asTreeLinesClosed({ lines: input.lines }),
        ...asDidYouKnowLines({ rows: [input.hint] }),
      ];
