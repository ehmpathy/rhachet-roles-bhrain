/**
 * .what = the three librarian commands that read a glob set of briefs
 */
export type LibrarianCommand =
  | 'census.minpeer'
  | 'census.cues'
  | 'brief.min.moveout';

/**
 * .what = the surface of each librarian command: its summary and every flag it reads
 * .why = one declaration feeds the arg parse AND the --help render, so the two cannot drift
 *        (rule.require.single-source-of-truth-for-render)
 */
export const LIBRARIAN_COMMANDS: Record<
  LibrarianCommand,
  {
    summary: string;
    flags: {
      name: string;
      kind: 'value' | 'boolean';
      required: boolean;
      sense: string;
    }[];
  }
> = {
  'census.minpeer': {
    summary: 'min lines absent from the .md beside them',
    flags: [
      {
        name: 'glob',
        kind: 'value',
        required: true,
        sense:
          'a set of `.md.min` files to check; repeat it to union several sets',
      },
      {
        name: 'files',
        kind: 'boolean',
        required: false,
        sense: 'add one row per min (absent lines / total, or `no .md peer`)',
      },
      {
        name: 'emit',
        kind: 'boolean',
        required: false,
        sense: 'print every absent line as `<min>\\t<line>`, no report',
      },
    ],
  },
  'census.cues': {
    summary: 'cue vs argument, per rule.prefer.rules-that-refout',
    flags: [
      {
        name: 'glob',
        kind: 'value',
        required: true,
        sense: 'a set of briefs to census; repeat it to union several sets',
      },
      {
        name: 'files',
        kind: 'boolean',
        required: false,
        sense: 'add one row per file (its cue share and size)',
      },
      {
        name: 'emit',
        kind: 'boolean',
        required: false,
        sense: 'print every cue line as `<file>\\t<line>`, no report',
      },
    ],
  },
  'brief.min.moveout': {
    summary:
      'move the .why sections of a set of mins out to the .md beside each',
    flags: [
      {
        name: 'glob',
        kind: 'value',
        required: true,
        sense: 'a set of `.md.min` files; repeat it to union several sets',
      },
      {
        name: 'mode',
        kind: 'value',
        required: false,
        sense: 'plan (default) lists each section; apply rewrites each min',
      },
    ],
  },
};
