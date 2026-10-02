/**
 * .what = one line of a stdout that breaks the treestruct form, and which way it breaks it
 */
export interface StdoutFormDefect {
  /** 1-based, within the text given */
  line: number;
  kind: 'flat-leaf' | 'rootless-leaf';
  text: string;
}

/**
 * .what = a tree ROOT: a glyph-led line whose next line opens a branch
 * .why = only a line a branch hangs from is a root; a glyph-led vibe line (`🦉 where were we?`)
 *        is followed by a blank line, so it is never mistaken for one
 */
const isRootLine = (input: {
  line: string;
  next: string | undefined;
}): boolean =>
  /^\S/.test(input.line) &&
  !/^[\w`"'{[(<#>*-]/.test(input.line) &&
  /^ {3}[├└]─/.test(input.next ?? '');

/**
 * .what = a line shaped as a branch of a tree: spaces and `│` first, then a glyph
 * .note = `│` alone is a spacer; `├─` / `└─` open a leaf; content nested under a leaf — a stone
 *         body, a paste — rides a `│` column, so it passes by the same test
 */
const isTreeLine = (input: { line: string }): boolean =>
  /^ {3}[ │]*(├─|└─|│)/.test(input.line);

/**
 * .what = finds each line of a stdout that is prose where a tree was owed
 * .why = `S13`: a surface that hand-rolled its layout rendered `at:` / `fix:` / `why:` as flat
 *        lines under a header, and no check caught it. this is that check — pure, so every
 *        snapshot in the repo can be walked through it (`rule.require.stdout-is-treestruct`)
 *
 * .note = two kinds, each a shape the flat renders took:
 *   - `flat-leaf` — inside a root's block, a line whose indent reaches text before a glyph:
 *     `🗿 guard: …` then `   at: 1.guard:12`
 *   - `rootless-leaf` — a base-indent line with no root above it, after a blank line:
 *     `   └─ ✋ halted` then a blank, then `   the stone prescribes = opus`
 * .note = a text with no root at all yields no defects. a prompt, a json body, a markdown file
 *         is not a tree, and this grades only what claims to be one
 */
export const getStdoutFormDefects = (input: {
  text: string;
}): StdoutFormDefect[] => {
  const lines = input.text.split('\n');
  const hasRoot = lines.some((line, index) =>
    isRootLine({ line, next: lines[index + 1] }),
  );
  if (!hasRoot) return [];

  // walk the lines; `inBlock` holds while each line continues the root above it
  const walked = lines.reduce<{
    inBlock: boolean;
    defects: StdoutFormDefect[];
  }>(
    (state, line, index) => {
      // a root opens a block
      if (isRootLine({ line, next: lines[index + 1] }))
        return { ...state, inBlock: true };

      // a blank line neither opens nor shuts a block — prose hung after a blank is still
      // prose under the tree above it (`S13`: the guidance note beneath a `└─`)
      if (line.trim() === '') return state;

      // an unindented line shuts it
      if (!/^ /.test(line)) return { ...state, inBlock: false };

      // an indented line is graded against whether a root sits above it
      const kind = asStdoutFormDefectKind({ line, inBlock: state.inBlock });
      if (!kind) return state;
      return {
        ...state,
        defects: [...state.defects, { line: index + 1, kind, text: line }],
      };
    },
    { inBlock: false, defects: [] },
  );
  return walked.defects;
};

/**
 * .what = the defect an indented line carries, or null
 * .note = inside a block, every line must be a branch; outside one, a base-indent line of text
 *         is a leaf with no tree to hang from. deeper indents outside a block are left alone —
 *         a code fence or a json body indents too, and is no tree
 */
const asStdoutFormDefectKind = (input: {
  line: string;
  inBlock: boolean;
}): StdoutFormDefect['kind'] | null => {
  if (input.inBlock) return isTreeLine(input) ? null : 'flat-leaf';
  return /^ {3}[^ ├└│]/.test(input.line) ? 'rootless-leaf' : null;
};
