import {
  IS_CACHEABLE_SECTION,
  ORDER_OF_SECTIONS,
  type PromptSectionChars,
} from '@src/domain.objects/Reviewer/PromptSectionChars';
import { asRateHuman } from '@src/domain.operations/review/asRateHuman';

/** one census row name, split into its parent row and its own label */
const asRowParts = (
  name: keyof PromptSectionChars,
): { parent: string | null; label: string } => {
  const [head, ...rest] = name.split('.');
  return rest.length === 0
    ? { parent: null, label: name }
    : { parent: head!, label: rest.join('.') };
};

/**
 * .what = the gutter every census row is drawn at
 * .why = callers that re-seat these rows into a gutter of their own slice this width
 *        off, so the width has one home — the render — rather than a copy per caller
 */
export const GUTTER_OF_SECTION_ROWS = '      ';

/**
 * .what = the seam mark a group of rows shares — the one mark all its members carry,
 *         or blank where they differ
 * .why = a parent row over children on both sides of the seam has no single true mark
 */
const asSeamMarkOfRows = (input: {
  names: (keyof PromptSectionChars)[];
  marks: { cacheable: string; perRound: string };
}): string => {
  const marks = [
    ...new Set(
      input.names.map((name) =>
        IS_CACHEABLE_SECTION[name]
          ? input.marks.cacheable
          : input.marks.perRound,
      ),
    ),
  ];
  return marks.length === 1 ? marks[0]! : '';
};

/** one row group — a lone row, or a parent row over its dotted children */
type RowGroup = {
  label: string;
  members: (keyof PromptSectionChars)[];
  nested: boolean;
};

/**
 * .what = the census rows, grouped so a dotted name (`targetDiffs.additions`) sits as
 *         a child beneath one parent row (`targetDiffs`)
 * .why = the parent row states the whole input's mass; the children state its parts.
 *        `ORDER_OF_SECTIONS` keeps a parent's children adjacent, so a group is a run of
 *        consecutive rows that share a parent
 */
const getAllRowGroups = (): RowGroup[] =>
  ORDER_OF_SECTIONS.reduce<RowGroup[]>((groups, name) => {
    const { parent, label } = asRowParts(name);
    const last = groups[groups.length - 1];
    if (parent !== null && last?.nested && last.label === parent)
      return [
        ...groups.slice(0, -1),
        { ...last, members: [...last.members, name] },
      ];
    return [
      ...groups,
      parent === null
        ? { label, members: [name], nested: false }
        : { label: parent, members: [name], nested: true },
    ];
  }, []);

/**
 * .what = the per-input census rows — one per named input, each with its chars, its
 *         share of the whole, and the side of the cache seam it sat on
 * .why = one render for the row, whichever breadth draws it, so a new column,
 *        seam mark, or share format has one home rather than two
 *        (rule.forbid.duplicate-format-tree-operations).
 *
 * .note = the parameters are exactly the declared divergences between the
 *         two surfaces: figure scale, absent glyph, seam words, and the
 *         last leaf (the grove appends totals beneath its rows).
 *
 * .note = a share over a zero total is undefined, never 0% — a prompt of no
 *         chars and a row of no chars must not render alike. `asRateHuman`
 *         owns that law.
 *
 * .note = a dotted input renders as a child of its parent row. the parent's mark is
 *         its children's shared mark, or blank where they differ — `targetDiffs`
 *         holds cacheable additions beside per-round mutations, so no single mark
 *         would be true of it
 */
export const asPromptSectionRows = (input: {
  sections: PromptSectionChars;
  total: number;
  figure: (count: number) => string;
  absent: string;
  marks: { cacheable: string; perRound: string };
  leafOfLast: '├─' | '└─';
}): string[] => {
  const groups = getAllRowGroups();
  const shareOf = (chars: number) =>
    asRateHuman({
      of: input.total === 0 ? null : chars / input.total,
      absent: input.absent,
    });
  const markOf = (names: (keyof PromptSectionChars)[]) =>
    asSeamMarkOfRows({ names, marks: input.marks });
  const rowOf = (row: {
    lead: string;
    label: string;
    width: number;
    chars: number;
    mark: string;
  }) =>
    `${GUTTER_OF_SECTION_ROWS}${row.lead}${row.label.padEnd(row.width)} ${input.figure(row.chars).padStart(13)} chars  ${shareOf(row.chars).padStart(6)}  ${row.mark}`.trimEnd();

  return groups.flatMap((group, index) => {
    const isLast = index === groups.length - 1;
    const leaf = isLast ? input.leafOfLast : '├─';
    const chars = group.members.reduce(
      (sum, name) => sum + input.sections[name],
      0,
    );
    const head = rowOf({
      lead: `${leaf} `,
      label: group.label,
      width: 13,
      chars,
      mark: markOf(group.members),
    });
    if (!group.nested) return [head];
    const gutter = isLast && input.leafOfLast === '└─' ? '   ' : '│  ';
    return [
      head,
      ...group.members.map((name, at) =>
        rowOf({
          lead: `${gutter}${at === group.members.length - 1 ? '└─' : '├─'} `,
          label: asRowParts(name).label,
          width: 10,
          chars: input.sections[name],
          mark: markOf([name]),
        }),
      ),
    ];
  });
};
