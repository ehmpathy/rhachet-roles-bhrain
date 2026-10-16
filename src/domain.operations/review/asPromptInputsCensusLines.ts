import { asCountHuman } from '@src/domain.operations/review/asCountHuman';
import {
  asPromptSectionRows,
  GUTTER_OF_SECTION_ROWS,
} from '@src/domain.operations/review/asPromptSectionRows';
import { asRateHuman } from '@src/domain.operations/review/asRateHuman';
import { getOneCharsByCacheSeam } from '@src/domain.operations/review/getOneCharsByCacheSeam';
import type { PromptInputsCensus } from '@src/domain.operations/review/getOnePromptInputsCensus';
import {
  asTargetLocusLines,
  LABEL_OF_LOCUS,
  LIMIT_OF_LOCUS_ROWS,
} from '@src/domain.operations/review/meter/asTargetLocusLines';
import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = the left gutter every census row is drawn at before it is re-seated
 * .why = `asPromptSectionRows` draws its rows at this fixed gutter, so the whole
 *        block is drawn at it too, then re-seated into the caller's gutter in ONE
 *        place — never two gutters within one block. read off the render, never
 *        re-declared, so the two cannot drift
 */
const GUTTER_OF_ROWS = GUTTER_OF_SECTION_ROWS;

/**
 * .what = the separator between two groups of peer rows
 * .why = the groups sit under one header, and a `├─` below each one says the branch
 *        stays open — so the separator carries the inner rail too. a bare blank
 *        would break the `│` a reader follows down to the final `└─`
 *        (rule.forbid.snapshot-visual-blemishes)
 */
const ROW_OF_RAIL = `${GUTTER_OF_ROWS}│`;

/**
 * .what = renders the by-input census — where the prompt chars actually sat
 * .why = the rollups name WHICH LANE spent the tokens; only this names WHICH
 *        INPUT. a cut is aimed at an input, never at a lane.
 *
 *        ONE render for the block at both breadths that fold a corpus — `--of tree`
 *        and `--of grove` — so a breadth cannot omit a stat its peer carries, and a
 *        new column lands at both or neither
 *        (rule.require.report-both-cost-levers-with-trend-and-locus ·
 *        rule.forbid.duplicate-format-tree-operations).
 *
 * .note = the parameters are exactly the declared divergences between the two
 *         surfaces: the header line, the gutter its rows sit in (the tree draws a
 *         `│` rail the grove has none of), and the absent form (`asFigureHuman`
 *         declares the grove's WORD and the tree's MARK as a pair).
 *
 * .note = each row is marked cacheable or not, because a share alone misreads:
 *         a large cacheable section is the cheap half, and a small uncacheable
 *         one can still be the dear half.
 */
export const asPromptInputsCensusLines = (input: {
  inputs: PromptInputsCensus;
  /** the section header line, drawn in full by the caller */
  header: string;
  /** the gutter each row is seated in — `'      '` on the grove, `'   │  '` on the tree */
  gutter: string;
  /** how an absent share reads on this surface */
  absent: string;
}): string[] => {
  const { inputs } = input;
  const asSeated = (rows: string[]): string[] =>
    asRowsSeatedInGutter({ rows, gutter: input.gutter });

  // an unread corpus is a fact, and it must not render as a census of zeroes.
  // it leads with THIS breadth's absent form, as every other absence on the page
  // does, and the reason follows in parens — never behind a dash, which beside the
  // tree's MARK would read `— —`, a dash read as a dash
  if (inputs.read === 0)
    return [
      input.header,
      ...asSeated([
        `${GUTTER_OF_ROWS}└─ ${input.absent} (no prompt could be read, ${inputs.unread} unread)`,
      ]),
    ];

  const shareOf = (n: number): string =>
    asShareOfCharsHuman({
      chars: n,
      total: inputs.chars,
      absent: input.absent,
    });

  // the two halves come back from ONE operation, so the complement is not
  // open-coded at the render. `cacheable` is a CEILING — see `getOneCharsByCacheSeam`
  const { cacheable, perRound } = getOneCharsByCacheSeam({
    sections: inputs.sections,
  });

  // the attribution grade, carried through the fold and rendered beside the rows it
  // qualifies (rule.forbid.failhide). the caveat fires on `unattributed` ALONE — an
  // UNSTATED grade is not a declined one, and to warn on it would claim a verdict
  // nobody rendered, in the other direction. `├─`, never `└─`: every section row and
  // every total follows it, so a leaf marker here would close a branch that reopens
  const caveat =
    inputs.unattributed > 0
      ? [
          `${GUTTER_OF_ROWS}├─ 🟡 ${inputs.unattributed} of ${asCountedNoun({ count: inputs.read, one: 'read run is', many: 'read runs are' })} UNATTRIBUTED — each run's own census`,
          `${GUTTER_OF_ROWS}│  declined to vouch, so scaffold may hide an input with no row. every`,
          `${GUTTER_OF_ROWS}│  share below is summed over them ALL, vouched and unvouched alike.`,
          `${GUTTER_OF_ROWS}│  to tell scaffold from an absent input, read one such run with its`,
          `${GUTTER_OF_ROWS}│  composition rows: rhx review._.cost --of run --at <rundir>`,
          ROW_OF_RAIL,
        ]
      : [];

  // ONE tree, one glyph discipline, exactly one `└─` and it is last. every row under
  // the header is a peer; a rail row groups them without a second glyph vocabulary
  // (rule.forbid.snapshot-visual-blemishes · rule.require.treestruct-output)
  const facts: string[] = [
    `├─ ${'corpus'.padEnd(13)} ${inputs.read} read · ${inputs.unread} unread · ${asCountedNoun({ count: inputs.targets, one: 'target file', many: 'target files' }, { figure: (count) => asCountHuman({ of: count }) })}`,
    `├─ ${'source'.padEnd(13)} ${inputs.compiled} compiled (exact) · ${inputs.parsed} parsed from the rendered prompt (coarse)`,
    `├─ ${'census'.padEnd(13)} ${inputs.attributed} attributed · ${inputs.unattributed} unattributed · ${inputs.ungraded} ungraded (no grade stated)`,
  ];

  return [
    input.header,
    ...asSeated([
      ...facts.map((one) => `${GUTTER_OF_ROWS}${one}`),
      ROW_OF_RAIL,
      ...caveat,
      // `per round` carries no space at its end. it and `cacheable` are both nine
      // chars, so the two marks align without one. the last row stays `├─` because
      // the totals follow it
      ...asPromptSectionRows({
        sections: inputs.sections,
        total: inputs.chars,
        figure: (count) => asCountHuman({ of: count }),
        absent: input.absent,
        marks: { cacheable: 'cacheable', perRound: 'per round' },
        leafOfLast: '├─',
      }),
      ROW_OF_RAIL,
      `${GUTTER_OF_ROWS}├─ ${'total'.padEnd(13)} ${asCountHuman({ of: inputs.chars }).padStart(13)} chars`,
      `${GUTTER_OF_ROWS}├─ ${'cacheable'.padEnd(13)} ${asCountHuman({ of: cacheable }).padStart(13)} chars  ${shareOf(cacheable).padStart(6)}  — the most any cache could ever serve`,
      `${GUTTER_OF_ROWS}├─ ${'per round'.padEnd(13)} ${asCountHuman({ of: perRound }).padStart(13)} chars  ${shareOf(perRound).padStart(6)}  — re-paid at full input rate, every round`,
      ROW_OF_RAIL,
      ...asCensusLocusLines({ inputs, absent: input.absent }),
    ]),
  ];
};

/**
 * .what = seats a block drawn at `GUTTER_OF_ROWS` into the caller's gutter
 * .why = a blank row becomes the gutter's own rail, so a `│` is never broken by an
 *        empty line
 */
const asRowsSeatedInGutter = (input: {
  rows: string[];
  gutter: string;
}): string[] =>
  input.rows.map((row) =>
    row === ''
      ? input.gutter.trimEnd()
      : `${input.gutter}${row.slice(GUTTER_OF_ROWS.length)}`,
  );

/**
 * .what = one row's share of the corpus chars, rendered as a rate
 * .why = a share over a zero total is undefined, so it renders ABSENT, never `0.0%`
 */
const asShareOfCharsHuman = (input: {
  chars: number;
  total: number;
  absent: string;
}): string =>
  asRateHuman({
    of: input.total === 0 ? null : input.chars / input.total,
    absent: input.absent,
  });

/**
 * .what = the census's LOCUS — which directories the target mass came from
 * .why = the rows above name the KIND of input; this names the PLACE, so a reader
 *        at this breadth can name a directory to prune from the report alone
 *        (rule.require.report-both-cost-levers-with-trend-and-locus, obligation 4).
 *
 * 🔴 .note = three states, rendered as three, and the coverage rides on each:
 *     - no read run recorded a locus → ABSENT, never an empty rollup. a run that
 *       carries no `locus` row makes no claim that it placed none
 *     - the placed runs carried no per-target mass → a FACT (a pull render)
 *     - else → the rollup, with `from P of R read runs` beside it, so a share is
 *       weighed against the runs that could supply it (rule.forbid.failhide)
 */
const asCensusLocusLines = (input: {
  inputs: PromptInputsCensus;
  /** how an absent locus reads on this surface — the breadth's own form */
  absent: string;
}): string[] => {
  const { locus } = input.inputs;
  const coverage = `from ${locus.placed} of ${asCountedNoun({ count: input.inputs.read, one: 'read run', many: 'read runs' })}`;

  // no run recorded a locus — absent, in this breadth's own form, with the reason
  // in parens and the one breadth that can place it
  if (locus.placed === 0)
    return [
      `${GUTTER_OF_ROWS}└─ ${LABEL_OF_LOCUS} — not recorded by any of ${asCountedNoun({ count: input.inputs.read, one: 'read run', many: 'read runs' })}`,
      `${GUTTER_OF_ROWS}   runs compiled before the locus row carry none. to place one such run,`,
      `${GUTTER_OF_ROWS}   read it alone: rhx review._.cost --of run --at <rundir>`,
    ];

  // every placed run sent paths and no payload — a fact, never an absence, so it
  // carries no absent form at all
  if (locus.targets.every((one) => one.chars === 0))
    return [
      `${GUTTER_OF_ROWS}└─ ${LABEL_OF_LOCUS} — no per-target mass to place, ${coverage} (a --focus pull render sends paths, no payload)`,
    ];

  // the measured answer — one render shared with the run breadth
  return asTargetLocusLines({
    targets: locus.targets,
    limit: LIMIT_OF_LOCUS_ROWS,
    head: `${GUTTER_OF_ROWS}└─ `,
    gutter: `${GUTTER_OF_ROWS}   `,
    suffix: `, ${coverage}`,
    // the census rows above print full separators, so the locus does too — one page,
    // one scale — and this breadth's own absent form, never the run's mark
    figure: asCountHuman,
    absent: input.absent,
    detail: null,
  });
};
