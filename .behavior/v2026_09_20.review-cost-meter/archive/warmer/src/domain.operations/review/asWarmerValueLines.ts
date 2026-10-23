import { asIsoPriceShape, type IsoPriceWords, priceSub } from 'iso-price';

import type {
  WarmerValue,
  WarmerValueVerdict,
} from '@src/domain.operations/review/getOneWarmerValue';
import { MINUTES_OF_CACHE_REACH } from '@src/domain.operations/review/MINUTES_OF_CACHE_REACH';
import {
  asCostColumnHuman,
  WIDTH_OF_COST_COLUMN,
} from '@src/domain.operations/review/meter/asCostColumnHuman';
import { asWarmerFloorClauses } from '@src/domain.operations/review/warmer/asWarmerFloorClauses';
import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = the verdict, in words a reader acts on with no arithmetic of their own
 * .why = the figures below it are the evidence; this line is the answer. a reader
 *        who must subtract two rows to learn whether the warmer paid has been handed
 *        the question, never the answer
 */
const VERDICT_WORDS: Record<WarmerValueVerdict, string> = {
  unproven:
    '🌙 unproven — no warmed run has settled, so there is naught to weigh the cost against',
  loss: '⛔ did NOT pay for itself — the settled pokes cost more than the most the cache could have saved',
  maybe:
    '🟡 may have paid — the amount saved is an upper bound (a read inside the cache ttl hits with no poke); weigh it against a `--warmer off` lane',
};

/**
 * .what = the short glyph for one lane row
 * .why = a lane row has no room for the verdict's words, so it carries the same
 *        glyph the verdict row opens with — one glyph, one verdict, at both widths
 */
export const GLYPH_OF_WARMER_VERDICT: Record<WarmerValueVerdict, string> = {
  unproven: '🌙',
  loss: '⛔',
  maybe: '🟡',
};

/**
 * .what = a signed price, sign first — `-$0.03`, never `$-0.03`
 * .why = the net is the one figure here that goes negative, and a sign buried after
 *        the currency glyph is the one a reader skims past
 */
const asSignedPriceHuman = (input: {
  of: IsoPriceWords;
  render: (input: { cost: IsoPriceWords }) => string;
}): string =>
  asIsoPriceShape(input.of).amount < 0n
    ? `-${input.render({ cost: priceSub('USD 0', input.of) })}`
    : input.render({ cost: input.of });

/**
 * .what = the net, or the breadth's absent mark where no warmed run has settled
 * .why = with no settled pair, `net` is merely `$0` — a figure that reads as a
 *        measured break-even while the verdict says `unproven`. two lines that
 *        disagree on one render teach a reader to trust neither, so an unweighed
 *        net renders absent
 */
const asNetHuman = (input: {
  of: WarmerValue;
  render: (input: { cost: IsoPriceWords }) => string;
  absent: string;
}): string =>
  input.of.verdict === 'unproven'
    ? input.absent
    : asSignedPriceHuman({ of: input.of.net, render: input.render });

/**
 * .what = the amount saved, or the breadth's absent mark where no warmed run has settled
 * .why = with no settled pair, no amount saved was measured, and an absence must never
 *        render as `$0` — that spelling is reserved for a nil that is a fact. a
 *        lapsed run IS such a fact: no review read its warmth, so a lane of lapsed
 *        runs alone renders `$0`, and a lane with none settled renders the absent mark
 */
const asSavedHuman = (input: {
  of: WarmerValue;
  render: (input: { cost: IsoPriceWords }) => string;
  absent: string;
}): string =>
  input.of.verdict === 'unproven'
    ? input.absent
    : input.render({ cost: input.of.saved });

/**
 * .what = the cost of the settled pairs alone — the cost the net is weighed against
 * .why = a lane row prints net, cost, and saved side by side, so a reader subtracts.
 *        the row's cost must be the one the net was computed from, or the row
 *        contradicts itself; the unweighed spend renders on the total's own row
 */
const getOneCostSettled = (input: { of: WarmerValue }): IsoPriceWords =>
  priceSub(input.of.cost, input.of.costAwaited);

/**
 * .what = the label a lane row ends with — its slug, and the head it ran with
 * .why = one slug with two heads is two lanes, so the slug alone would print two
 *        rows a reader cannot tell apart. the head is the short digest of the
 *        prompt head (`getOneReviewRunHead`), and is absent where none was on record
 */
const asLaneLabel = (input: { of: WarmerValue }): string =>
  input.of.lane?.head
    ? `${input.of.key} @${input.of.lane.head.slice(0, 7)}`
    : input.of.key;

/**
 * .what = the header of the warmer-value block, at every breadth
 * .why = one concept, one string: the block's body is shared, so its header is too —
 *        a reader who meets it at `--of tree` and at `--of grove` reads one title
 */
export const HEADER_OF_WARMER_VALUE = 'warmer — did it pay for itself?';

/**
 * .what = renders the warmer's value as tree rows, at any breadth
 *
 * .why = both folds owe this block, so one renderer draws it for both — a verdict
 *        that reads differently at `tree` and `grove` is one a reader cannot trust
 *        (rule.require.single-source-of-truth-for-render,
 *        rule.forbid.duplicate-format-tree-operations).
 *
 * .note = `lanes: false` renders the total alone and points at the breadth that holds
 *         the per-lane rows. the grove spans every tree on the machine, so its lane
 *         list is unbounded; the tree's is the one a driver acts on
 */
export const asWarmerValueLines = (input: {
  value: { lanes: WarmerValue[]; total: WarmerValue | null };
  indent: string;
  lanes: boolean;
  absent: string;
}): string[] => {
  // no warmer ran, so there is no value to state
  const { total } = input.value;
  if (!total) return [];

  // the answer, then the three figures it rests on. every count agrees with its noun
  // through `asCountedNoun`, the one home of that decision across every render. every
  // money figure in the block renders at the one column precision, so a reader who
  // weighs `net` against `settled` reads one figure in one form, row to row
  const rows = [
    `verdict:   ${VERDICT_WORDS[total.verdict]}`,
    `cost:      ${asCostColumnHuman({ cost: total.cost })} over ${asCountedNoun({ count: total.pokes, one: 'poke', many: 'pokes' })}, ${total.hits} of which HIT${total.costIsFloor ? ` — a FLOOR: ${asWarmerFloorClauses({ faults: total.faults, unterminated: total.runsUnterminated }).join('; ')}` : ''}`,
    total.verdict === 'unproven'
      ? `saved:     ${input.absent} (unmeasured — no warmed run has settled)`
      : `saved:     at most ${asSavedHuman({ of: total, render: asCostColumnHuman, absent: input.absent })}, across ${asCountedNoun({ count: total.reviewsCovered, one: 'review', many: 'reviews' })} that followed a warmed run`,
    `net:       ${asNetHuman({ of: total, render: asCostColumnHuman, absent: input.absent })}${total.verdict === 'unproven' ? '' : `, over the settled cost of ${asCostColumnHuman({ cost: getOneCostSettled({ of: total }) })}`}`,
    ...(total.runsLapsed > 0
      ? [
          `lapsed:    ${asCountedNoun({ count: total.runsLapsed, one: 'warmed run', many: 'warmed runs' })} no review read — the lane moved to a new head, or no review came within the ${MINUTES_OF_CACHE_REACH}-minute cache reach — settled at $0 saved`,
        ]
      : []),
    ...(total.runsUncovered > 0
      ? [
          `unweighed: ${asCostColumnHuman({ cost: total.costAwaited })} over ${asCountedNoun({ count: total.runsUncovered, one: 'warmed run', many: 'warmed runs' })} — beside the net, never inside it`,
        ]
      : []),
    ...(total.runsUncovered - total.runsUnpriced > 0
      ? [
          `awaited:   ${asCountedNoun({ count: total.runsUncovered - total.runsUnpriced, one: 'warmed run', many: 'warmed runs' })} whose ${MINUTES_OF_CACHE_REACH}-minute cache reach is still open — each settles once a review reads it or the reach passes`,
        ]
      : []),
    ...(total.runsUnpriced > 0
      ? [
          `unpriced:  ${asCountedNoun({ count: total.runsUnpriced, one: 'warmed run', many: 'warmed runs' })} a review DID read, whose amount saved went unrecorded — no settle follows`,
        ]
      : []),
  ];

  // per lane, where this breadth owns them; else a pointer to the breadth that does.
  // a head over no rows names why it is empty — a bare `└─ by lane` promises a child
  // that never renders. warmed runs from a hand `rhx review` carry no lane identity
  const laneHead = !input.lanes
    ? 'by lane: see `--of tree` in each worktree'
    : input.value.lanes.length === 0
      ? 'by lane: (none — the warmed runs carry no lane identity)'
      : 'by lane';
  // the lane rows are columns, so each figure renders at the one column precision and
  // width every cost column shares; the net pads one wider for its sign. the cost
  // column is the SETTLED cost, so `net = saved − settled` holds on every row
  const laneRows = input.lanes
    ? input.value.lanes.map(
        (lane, index, all) =>
          `   ${index === all.length - 1 ? '└─' : '├─'} ${GLYPH_OF_WARMER_VERDICT[lane.verdict]} net ${asNetHuman({ of: lane, render: asCostColumnHuman, absent: input.absent }).padStart(WIDTH_OF_COST_COLUMN + 1)}  settled ${asCostColumnHuman({ cost: getOneCostSettled({ of: lane }) }).padStart(WIDTH_OF_COST_COLUMN)}  saved ≤ ${asSavedHuman({ of: lane, render: asCostColumnHuman, absent: input.absent }).padStart(WIDTH_OF_COST_COLUMN)}  ${asLaneLabel({ of: lane })}`,
      )
    : [];

  // draw the branch — the lane head is the last top-level row, so it closes it
  return [
    ...rows.map((row) => `${input.indent}├─ ${row}`),
    `${input.indent}└─ ${laneHead}`,
    ...laneRows.map((row) => `${input.indent}${row}`),
  ];
};
