import {
  asIsoPriceHuman,
  type IsoPrice,
  IsoPriceExponent,
  IsoPriceRoundMode,
  setPricePrecision,
} from 'iso-price';
import * as path from 'path';

import type {
  TokenPriceByKind,
  TokenPriceSum,
  TokenSpendInventoryRow,
  TokenSpendReport,
} from '@src/domain.objects/Reflector/TokenSpendReport';
import { asTokenCountHuman } from '@src/infra/cli/asTokenCountHuman';
import { asTreeBranchMarkers } from '@src/infra/cli/asTreeBranchMarkers';

import { asGroupsByKey } from './asGroupsByKey';
import { asLeavesCapped } from './asLeavesCapped';
import type { TokenProposalTarget } from './asTokenProposal';
import { asTokenRepaidRank } from './asTokenRepaidRank';
import { asTokenRepaidTotal } from './asTokenRepaidTotal';
import { asTreeLeaves } from './asTreeLeaves';

/**
 * .what = how many entries a list shows before the rest becomes one `(N more)` leaf
 * .why = one cap for every list, the repaid rows included, so every list in the report reads alike
 */
const LIST_CAP = 10;

/**
 * .what = renders a token spend report as the owl vibe line, then one tree
 * .why = every stdout a human reads is a vibe line, then a tree; each fact is a leaf
 */
export const formatTokenSpendTree = (input: {
  report: TokenSpendReport;
  proposal: { rankedBy: 'price' | 'tokens'; targets: TokenProposalTarget[] };
}): string => {
  const { report, proposal } = input;
  const sections: string[][] = [
    asTranscriptSection({ report }),
    asEfficiencySection({ report }),
    asInventorySection({ report }),
    asRepaidSection({ report }),
    ...(report.subagents.length > 0 ? [asSubagentsSection({ report })] : []),
    ...(report.skipped.length > 0 ? [asSkippedSection({ report })] : []),
    asProposalSection({ proposal }),
  ];
  return [
    '🦉 the pond reflects what it was fed',
    '',
    '🌕 reflect.on.token.spend',
    ...asBranches({ sections }),
    '',
  ].join('\n');
};

/**
 * .what = joins sections into branches of one root, with a `│` spacer between them
 * .why = a blank line never parts a tree; a spacer does
 */
const asBranches = (input: { sections: string[][] }): string[] =>
  input.sections.flatMap((section, index) => {
    const isLast = index === input.sections.length - 1;
    const { elbow, stem } = asTreeBranchMarkers({ isLast });
    const [head, ...rest] = section;
    return [
      `   ${elbow} ${head}`,
      ...rest.map((line) => `   ${stem}${line}`),
      ...(isLast ? [] : ['   │']),
    ];
  });

const asTranscriptSection = (input: { report: TokenSpendReport }): string[] => {
  const { report } = input;
  const isCorpus = report.transcripts.length > 1;
  const matched = report.transcripts.length + report.skipped.length;
  const isListed = matched > 1;
  // the title and the body both follow what was matched: a plural title counts and lists the
  // matched set, even where only one of them was metered — so `transcripts (N)`, `matched = N`,
  // and the paths under `chosen by` always agree. a skipped path is listed with its kind; the
  // skipped section below still says why
  return [
    isListed ? `transcripts (${asCount(matched)})` : 'transcript',
    ...asTreeLeaves({
      leaves: [
        ...(isListed
          ? [
              `matched = ${asCount(matched)} · metered = ${asCount(report.transcripts.length)} · skipped = ${asCount(report.skipped.length)}`,
              {
                line: `chosen by = ${report.transcripts[0]!.chosenBy}`,
                children: asLeavesCapped({
                  items: [
                    ...report.transcripts.map((entry) => entry.path),
                    ...report.skipped.map(
                      (entry) => `${entry.path} (skipped · ${entry.kind})`,
                    ),
                  ],
                  cap: LIST_CAP,
                }),
              },
              ...(!isCorpus && report.transcripts[0]!.subagentOf
                ? [`subagent of = ${report.transcripts[0]!.subagentOf}`]
                : []),
            ]
          : [
              `path = ${report.transcripts[0]!.path}`,
              `chosen by = ${report.transcripts[0]!.chosenBy}`,
              ...(report.transcripts[0]!.subagentOf
                ? [`subagent of = ${report.transcripts[0]!.subagentOf}`]
                : []),
            ]),
        `calls = ${asCount(report.calls)}`,
        ...(report.rebases.length > 0
          ? [
              {
                line: `rebases = ${report.rebases.length}`,
                children: asLeavesCapped({
                  items: report.rebases.map(
                    (rebase) =>
                      `call ${rebase.call} · ${rebase.cause} · ${asCount(rebase.from)} → ${asCount(rebase.to)}${isCorpus ? ` · in ${path.basename(rebase.transcript)}` : ''}`,
                  ),
                  cap: LIST_CAP,
                }),
              },
            ]
          : [`rebases = 0`]),
        ...(report.partialLinesSkipped > 0
          ? [
              `partial lines skipped = ${report.partialLinesSkipped} (a live tail)`,
            ]
          : []),
      ],
    }),
  ];
};

const asEfficiencySection = (input: { report: TokenSpendReport }): string[] => {
  const { efficiency, contextPerCall } = input.report;
  const total =
    efficiency.inputRaw +
    efficiency.cacheRead +
    efficiency.cacheWrite5m +
    efficiency.cacheWrite1h +
    efficiency.output;
  const { byKind } = efficiency.priced;
  const row = (rowOf: {
    name: string;
    tokens: number;
    price: TokenPriceByKind[keyof TokenPriceByKind];
  }): string =>
    `${rowOf.name.padEnd(16)}= ${asCount(rowOf.tokens).padStart(13)}  ${asShare({ part: rowOf.tokens, whole: total }).padStart(6)}  ${asKindPriced({ price: rowOf.price, tokens: rowOf.tokens }).padStart(10)}`;
  return [
    'efficiency (measured, from message.usage)',
    ...asTreeLeaves({
      leaves: [
        row({
          name: 'input.raw',
          tokens: efficiency.inputRaw,
          price: byKind.input,
        }),
        row({
          name: 'cache.read',
          tokens: efficiency.cacheRead,
          price: byKind.cacheRead,
        }),
        row({
          name: 'cache.write.5m',
          tokens: efficiency.cacheWrite5m,
          price: byKind.cacheWrite5m,
        }),
        row({
          name: 'cache.write.1h',
          tokens: efficiency.cacheWrite1h,
          price: byKind.cacheWrite1h,
        }),
        row({
          name: 'output',
          tokens: efficiency.output,
          price: byKind.output,
        }),
        asTotalPriceLeaf({ priced: efficiency.priced }),
        `models = ${efficiency.models.join(', ')}`,
        ...(contextPerCall
          ? [
              {
                line: 'context.per-call',
                children: [
                  `median = ${asCount(contextPerCall.median)}`,
                  `peak   = ${asCount(contextPerCall.peak)}`,
                ],
              },
            ]
          : []),
      ],
    }),
  ];
};

const asInventorySection = (input: { report: TokenSpendReport }): string[] => {
  const { inventory } = input.report;
  const total = inventory.reduce((sum, row) => sum + row.tokens, 0);
  return [
    'inventory (context at the last call, by category)',
    ...asTreeLeaves({
      leaves: [
        ...inventory.map((row) => ({
          line: `${row.category.padEnd(18)} ${asCount(row.tokens).padStart(11)}  ${asShare({ part: row.tokens, whole: total }).padStart(6)}  [${row.tiers.join(', ')}]${asSpreadText({ spread: row.spread })}`,
          children: asTopLabels({
            labels: row.labels,
            whole: row.tokens,
            of: row.category,
          }),
        })),
        ...input.report.notes.map((note) => `note: ${note}`),
      ],
    }),
  ];
};

/**
 * .what = a corpus row's spread across sessions, as ` (p10 · p50 · p90)`; naught for one
 * .why = a corpus share alone hides whether every session holds it or a few hold it all
 */
const asSpreadText = (input: {
  spread: TokenSpendInventoryRow['spread'];
}): string => {
  if (input.spread === null) return '';
  const { p10, p50, p90 } = input.spread;
  return `  (p10 ${asShare({ part: p10, whole: 1 })} · p50 ${asShare({ part: p50, whole: 1 })} · p90 ${asShare({ part: p90, whole: 1 })})`;
};

/**
 * .what = the three largest labels of a row, then a sum of the rest
 * .why = a category with thirty tools must stay scannable at a glance
 * .note = the first share names its whole, so a sub-row share never reads as a share of all
 */
const asTopLabels = (input: {
  labels: { label: string; tokens: number }[];
  whole: number;
  of: string;
}): string[] => {
  // a lone label carries no split, but it still names what the row holds
  const [labelOnly, ...labelsAfter] = input.labels;
  if (!labelOnly) return [];
  if (labelsAfter.length === 0)
    return input.of.startsWith(labelOnly.label)
      ? []
      : [`holds = ${labelOnly.label}`];
  const top = input.labels.slice(0, 3);
  const rest = input.labels.slice(3);
  const restTokens = rest.reduce((sum, entry) => sum + entry.tokens, 0);
  return [
    ...top.map(
      (entry, index) =>
        `${entry.label.padEnd(28)} ${asCount(entry.tokens).padStart(11)}  ${asShare({ part: entry.tokens, whole: input.whole }).padStart(6)}${index === 0 ? ` of ${input.of}` : ''}`,
    ),
    ...(rest.length > 0
      ? [
          `${`(${rest.length} more)`.padEnd(28)} ${asCount(restTokens).padStart(11)}  ${asShare({ part: restTokens, whole: input.whole }).padStart(6)}`,
        ]
      : []),
  ];
};

const asRepaidSection = (input: { report: TokenSpendReport }): string[] => {
  // the same order the proposal ranks by: price when whole, else tokens
  const { measure } = asTokenRepaidRank({ repaid: input.report.repaid });
  const whole = input.report.repaid.reduce((sum, row) => sum + measure(row), 0);
  const ranked = [...input.report.repaid].sort(
    (a, b) => measure(b) - measure(a),
  );
  const rows = ranked.slice(0, LIST_CAP);

  // rows past the cap are named as a count and a share, never dropped in silence
  const rest = ranked.slice(LIST_CAP);
  const restShare = asShare({
    part: rest.reduce((sum, row) => sum + measure(row), 0),
    whole,
  });
  const restLeaves =
    rest.length > 0 ? [`(${rest.length} more, ${restShare} together)`] : [];

  // one column width for every label shown, so the figures align
  const labelOf = (row: (typeof rows)[number]): string =>
    `${row.category} · ${row.label}`;
  const labelWidth = Math.max(0, ...rows.map((row) => labelOf(row).length));
  return [
    'repaid (what each block cost, every call it stayed in context — priced per cache span)',
    ...asTreeLeaves({
      leaves: rows.length
        ? [
            ...rows.map((row) => ({
              line: `${labelOf(row).padEnd(labelWidth)}  ${asPriced(row.priced).padStart(10)}  ${asShare({ part: measure(row), whole }).padStart(6)}  ${asTokenCountHuman({ tokens: asTokenRepaidTotal({ tokens: row.tokens }) }).padStart(8)} tok`,
              children: [
                asSpanLine({ row }),
                ...(row.peak
                  ? [
                      `peak = ${asCount(row.peak.tokens)} tok @ call ${row.peak.arrivedAtCall}, held ${asCount(row.peak.calls)} ${row.peak.calls === 1 ? 'call' : 'calls'}`,
                    ]
                  : []),
              ],
            })),
            ...restLeaves,
          ]
        : ['(none)'],
    }),
  ];
};

const asSubagentsSection = (input: { report: TokenSpendReport }): string[] => [
  `subagents (${input.report.subagents.length}, their own spend)`,
  ...asTreeLeaves({
    // the heaviest first, so a capped list shows the subagents that spent the most
    leaves: asLeavesCapped({
      items: [...input.report.subagents]
        .sort((a, b) => b.tokens - a.tokens)
        .map((subagent) => ({
          line: subagent.path,
          children: [
            `calls = ${asCount(subagent.calls)}`,
            `tokens = ${asCount(subagent.tokens)}`,
            `price = ${asPriced(subagent.priced)}`,
          ],
        })),
      cap: LIST_CAP,
    }),
  }),
];

/**
 * .what = the corpus files that could not be read, one bucket per cause
 * .why = a corrupt file and a file with no meter data ask for different repairs; neither
 *        may read as the other, and neither is folded into the totals as zeros
 */
const asSkippedSection = (input: { report: TokenSpendReport }): string[] => [
  `skipped (${input.report.skipped.length})`,
  ...asTreeLeaves({
    leaves: asGroupsByKey({
      items: input.report.skipped,
      keyOf: (entry) => entry.kind,
    }).map((ofKind) => ({
      line: `${ofKind[0]!.kind} (${ofKind.length})`,
      children: asLeavesCapped({
        items: ofKind.map((entry) =>
          entry.line ? `${entry.path} @ line ${entry.line}` : entry.path,
        ),
        cap: LIST_CAP,
      }),
    })),
  }),
];

const asProposalSection = (input: {
  proposal: { rankedBy: 'price' | 'tokens'; targets: TokenProposalTarget[] };
}): string[] => [
  `proposal (ranked by repaid ${input.proposal.rankedBy} — an upper bound, not a promise)`,
  ...asTreeLeaves({
    leaves: input.proposal.targets.length
      ? input.proposal.targets.map((target, index) => ({
          line: `${index + 1}. ${target.row.category} · ${target.row.label}  ≤ ${input.proposal.rankedBy === 'price' ? asPriced(target.row.priced) : `${asTokenCountHuman({ tokens: asTokenRepaidTotal({ tokens: target.row.tokens }) })} tok`}  ${asShare({ part: target.share, whole: 1 })}`,
          children: target.hint ? [`hint: ${target.hint}`] : [],
        }))
      : ['(no target)'],
  }),
];

/**
 * .what = one repaid row split by the span it was paid through: price first, tokens beside
 * .why = a cache read costs a tenth of a raw input, so the span is where the cost sits
 */
const asSpanLine = (input: {
  row: TokenSpendReport['repaid'][number];
}): string => {
  const { tokens, priced } = input.row;
  const span = (spanOf: {
    name: string;
    count: number;
    price: TokenPriceByKind[keyof TokenPriceByKind];
  }): string =>
    `${spanOf.name} ${asKindPriced({ price: spanOf.price, tokens: spanOf.count })} (${asTokenCountHuman({ tokens: spanOf.count })})`;
  return [
    span({
      name: 'read',
      count: tokens.cacheRead,
      price: priced.byKind.cacheRead,
    }),
    span({
      name: 'write.5m',
      count: tokens.cacheWrite5m,
      price: priced.byKind.cacheWrite5m,
    }),
    span({
      name: 'write.1h',
      count: tokens.cacheWrite1h,
      price: priced.byKind.cacheWrite1h,
    }),
    span({ name: 'input', count: tokens.input, price: priced.byKind.input }),
  ].join(' · ');
};

/**
 * .what = one kind's price as human dollars; `unpriced` where tokens sat with no rate
 * .why = zero tokens cost zero at any rate; tokens with no rate are never a false $0
 */
const asKindPriced = (input: {
  price: TokenPriceByKind[keyof TokenPriceByKind];
  tokens: number;
}): string => {
  if (input.price !== null) return asDollars({ price: input.price });
  return input.tokens === 0 ? '$0.00' : 'unpriced';
};

/**
 * .what = the `total price` leaf; where any token sat with no rate, it names why and what lifts it
 * .why = a wall of `unpriced` with no cause reads as a defect; the reader must know the counts
 *        still stand and that the gap is an absent rate spec, never a guess withheld
 */
const asTotalPriceLeaf = (input: {
  priced: TokenPriceSum;
}): string | { line: string; children: string[] } => {
  const line = `total price = ${asPriced(input.priced)}`;
  const isPricedWhole =
    input.priced.price !== null && input.priced.unpricedTokens === 0;
  if (isPricedWhole) return line;
  return {
    line,
    children: [
      'why  = no rate spec for these tokens in the installed brain packages; a rate is never guessed',
      'held = every token count above is measured; only the $ is absent',
      'lift = a brain package version whose spec covers these models',
    ],
  };
};

/**
 * .what = a price sum as human dollars, or `unpriced`, with any unpriced tokens named
 * .why = an absent rate must read as absent, never as $0
 */
const asPriced = (priced: TokenPriceSum): string => {
  if (priced.price === null) return 'unpriced';
  const human = asDollars({ price: priced.price });
  if (priced.unpricedTokens === 0) return human;
  return `${human} + ${asTokenCountHuman({ tokens: priced.unpricedTokens })} tok unpriced`;
};

/**
 * .what = a price as human dollars, rounded to the cent
 */
const asDollars = (input: { price: IsoPrice }): string =>
  asIsoPriceHuman(
    setPricePrecision(
      { of: input.price, to: IsoPriceExponent.CENTI },
      { round: IsoPriceRoundMode.HALF_UP },
    ),
  );

const asCount = (value: number): string => value.toLocaleString('en-US');

const asShare = (input: { part: number; whole: number }): string =>
  input.whole === 0
    ? '0.0%'
    : `${((input.part / input.whole) * 100).toFixed(1)}%`;
