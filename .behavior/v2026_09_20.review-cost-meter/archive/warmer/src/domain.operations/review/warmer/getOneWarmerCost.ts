import { UnexpectedCodePathError } from 'helpful-errors';
import type { IsoPriceWords } from 'iso-price';
import { asIsoPrice, priceSum } from 'iso-price';

import { getOneFileText } from '@src/domain.operations/review/getOneFileText';
import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';
import { asWarmerRowParseFault } from '@src/domain.operations/review/warmer/asWarmerRowParseFault';
import { isWarmerRowTerminal } from '@src/domain.operations/review/warmer/isWarmerRowTerminal';
import { NAME_OF_WARMER_ROWS } from '@src/domain.operations/review/warmer/setOneWarmerPokeRow';
import type {
  WarmerPokeMeasured,
  WarmerPokeRow,
} from '@src/domain.operations/review/warmer/WarmerPokeRow';

import * as path from 'node:path';

/**
 * .what = what a warmer spent to protect one run's prefix
 * .why = `0.wish` bar 9's third claim is a purpose: the rows land beside the review
 *        output so `review._.cost` reaches them. the rows were written and read by
 *        nobody, so the bar's name and test were met and its purpose was not (F27).
 *
 * .note = `hits` rides beside `pokes` rather than as a rate. a poke misses about
 *         1 in 5 from replica dispatch, and a miss bills in full — measured live
 *         at 37.7x a hit — so a rate would hide the term that costs the most.
 */
export interface WarmerCost {
  /** how many pokes were sent — a defer spends naught, so it is not one */
  pokes: number;
  /** how many of those the provider served from cache */
  hits: number;
  /**
   * what the pokes cost, summed from what each one measured.
   *
   * words, never the human form. this figure is summed downstream, across runs,
   * into the net value a verdict reads — the human form is a lossy display view,
   * so a sum over it drifts the net and can flip the verdict. render the human
   * form at the edge alone (rule.require.iso-price).
   */
  cost: IsoPriceWords;
  /**
   * how many attempts faulted — measured naught, and may still have billed.
   *
   * this is the warmer's `unknown`, and why `cost` above is a floor rather than
   * a total. `setReviewWarmerPokes` states the mechanism outright: a timeout
   * abandons our wait and cannot cancel the provider's work, so the call may
   * well have billed. no measurement can part a fault that billed from one
   * that did not.
   *
   * rides beside `cost`, never inside it. to fold an unmeasured charge into
   * the sum would state a figure no artifact measured; to drop it silent
   * would render a possibly-billed act as nil spend — the exact inversion
   * `0.wish` bar 4 exists to refuse (rule.forbid.failhide).
   */
  faults: number;
  /**
   * whether the ledger has no terminator — the plan did not finish.
   *
   * this is the second reason `cost` above is a floor. `emitReviewWarmerSpawn`
   * prints `stop: kill <pid>`; node's default SIGTERM handler terminates with
   * no JS unwind, so no `retire` row lands — and a SIGTERM mid-poke kills a
   * request the provider may still have billed, and no row lands for it at
   * all. that warmer reads `faults: 0`, so a floor driven by faults alone
   * calls its incomplete sum a total (`0.wish` bar 4).
   *
   * .note = names the record, never a cause. an absent terminator means the
   *         warmer is still awake — bar 9b invites exactly that mid-flight
   *         read — or that it was killed. this operation holds only the run
   *         dir; the liveness probe is per-reviewer state outside its reach,
   *         so a field named `stopped` would assert a cause it cannot measure.
   *
   *         the floor claim holds under both causes, which is why one flag
   *         serves: an awake warmer's sum will grow, and a killed one's may
   *         have billed a poke the signal cut short. neither is a total.
   *
   *         `setReviewWarmerPokes` built the terminator for exactly this
   *         read and named the harm in its own words — a record with no
   *         terminator cannot be told from a record that stopped — and no
   *         reader checked for one until 2026-09-25. bar 9's own failure a
   *         layer down, the one F27 closed for these rows.
   */
  truncated: boolean;
  /**
   * the `at` of the ledger's last row of ANY kind — a poke, a deferral, a fault,
   * or the terminator — or null where the ledger holds none.
   *
   * it is not the last poke. a deferral or a terminator can follow the last poke,
   * so this instant is at or after the last touch of the cache. the reach measured
   * from it is therefore generous: a lapse it reports is certain, and a review it
   * credits may sit a few minutes past the true reach of the last poke.
   *
   * past the cache reach (`MINUTES_OF_CACHE_REACH`) from this instant no later
   * review can read the warmth, so a warmed run whose last row is that old has a
   * settled benefit of naught
   */
  lastAt: string | null;
}

/**
 * .what = what one warmer act tells you about money — the only axis this reader cares about
 * .why = a compile-time exhaustiveness gate exists because the absence of one cost
 *        real money. a prior draft filtered on `measured !== null` under a comment
 *        that enumerated `defer` and `retire` — two of the act union's four
 *        members. the fourth, `fault`, silently joined them:
 *
 *        | the act   | measured | spent | grade |
 *        |-----------|----------|-------|-------|
 *        | `poke`    | yes      | yes   | `known` |
 *        | `defer`   | no       | naught — a real review had touched the prefix | `naught` |
 *        | `retire`  | no       | naught — the budget was already gone | `naught` |
 *        | `fault`   | no       | the provider's work ran; only our wait died | `unknown` |
 *
 *        so a faulted attempt that may well have billed was dropped by a filter
 *        written for acts that cost naught, and the sum read as a total when it
 *        was a floor — `0.wish` bar 4's inversion, one layer below the run grade.
 *
 * .note = the `never` is the whole point. a fifth act cannot be added without a
 *         decision here, since the typecheck refuses until one is made. the
 *         prior shape could absorb a new member in silence, which is what it did
 *         (rule.prefer.prevent-over-correct: make it impossible, never merely catch it).
 *
 * .note = three types in this domain declare a field named `act`, and two of
 *         them share three member names:
 *
 *           `ReviewWarmerSpawn.act`   = spawned · found · refused          (spawn time)
 *           `WarmerWakeVerdict.act`   = poke · defer · retire              (wake time)
 *           `WarmerPokeRow.act`       = poke · defer · retire · fault      (record time)
 *
 *         the wake verdict declares in its own jsdoc that the three outcomes
 *         are exhaustive — true of it, and false of the row that records what
 *         followed. a reader who holds the verdict's model reads the row union
 *         as the same set, precisely the mistake the gate above now refuses.
 */
const asSpendGrade = (
  act: WarmerPokeRow['act'],
): 'known' | 'naught' | 'unknown' => {
  switch (act) {
    case 'poke':
      return 'known';
    case 'defer':
    case 'retire':
      return 'naught';
    case 'fault':
      return 'unknown';
    default: {
      const unhandled: never = act;
      throw new UnexpectedCodePathError(
        'a warmer act carries no spend grade, so its money is unaccounted',
        { act: unhandled },
      );
    }
  }
};

/**
 * .what = reads a poke's measurement, or fails loud where the row carries none
 * .why = `act: 'poke'` and `measured: null` is a contradiction the type permits,
 *        and it used to fold in as free spend. `measured?.cost ?? '$0'` graded an
 *        unmeasured poke a measured nil — `0.wish` bar 4's inversion, the one
 *        `rule.forbid.failhide` names outright: a nil that is an absence
 *        rendered as a nil that is a fact.
 *
 *        and it rendered `0 of which hit` beside it, since `measured?.hit`
 *        reads a torn row's hit as `false`. so one broken row produced a whole
 *        confident sentence about spend nobody measured.
 *
 * .note = throws rather than grades `fault`, and the difference is who is at
 *         fault. a `fault` row is a real fact about the world — our wait died
 *         and the provider's work may have billed, which no measurement can
 *         part. a `poke` with no measurement is a defect in the writer:
 *         `setOneWarmerPokeRow` writes one on every poke by construction, so its
 *         absence is a broken invariant rather than an outcome. to grade it
 *         `fault` would file our own defect under a category that means "the
 *         provider acted beyond our sight", and the ledger would read as honest.
 *
 * .note = the type binds the writer, never this read. `WarmerPokeRow` is a union on
 *         `act`, so this repo's code cannot build a poke with no measurement — but the
 *         row arrives as `JSON.parse(line) as WarmerPokeRow`, a cast over a file a
 *         prior tool version or any hand can have written. this guard is the parse
 *         boundary's own, and it stays
 *
 * .note = measured 2026-09-25, over the suite's 26 tests: a fallback measurement
 *         in place of this throw goes 4 of 26 red, all four `[case8]`'s own.
 *         `[t2]` — the defer that legitimately carries `measured: null` — stays
 *         green under the neuter, which proves the guard reads the act and not
 *         merely the null (rule.require.clamp-edge-cases).
 */
const asPokeMeasurement = (input: {
  row: WarmerPokeRow;
  dir: string;
  number: number;
}): WarmerPokeMeasured =>
  input.row.measured ??
  ReviewRunArtifactError.throw(
    `a poke row carries no measurement, so its spend is unaccounted, in ${NAME_OF_WARMER_ROWS}`,
    {
      dir: input.dir,
      file: NAME_OF_WARMER_ROWS,
      row: input.number,
      attempt: input.row.attempt,
      reviewer: input.row.reviewer,
    },
  );

/**
 * .what = reads what a warmer spent on one run, or null where this run has no rows
 * .why = null and zero are different facts, and the whole meter turns on the
 *        distinction (`getOneAccountedCost`). a run with no warmer file spawned
 *        no warmer; a run whose warmer only ever deferred was protected for free.
 *        to state both as `0` states the first fact about the second case.
 *
 * .note = `null` means no row, never "never protected". this claimed "never
 *         protected" until 2026-09-25, which the findsert bar 14 mandates
 *         makes false: the second round of a guard finds round one's warmer
 *         alive, skips its own spawn, and no row lands for it — while that
 *         warmer pokes a head the two rounds share, so round two is protected
 *         and its ledger is empty.
 *
 *         measured on this very branch: i001 cached 0.0% and i002 cached
 *         28.5%, and only i001 holds warmer rows. the round that visibly
 *         benefited is the round this operation reports as unprotected.
 *
 *         callers must read `null` as an absent record and infer no cover
 *         from it:
 *         `.dream/v2026_09_25.fix.a-findsert-skip-reads-as-a-prefix-never-protected.md`
 *
 * .note = a present-but-unparseable row fails loud rather than reads as
 *         absent — the same law `getOneRunArtifactJson` obeys
 *         (rule.forbid.failhide). a warmer appends one whole row per write,
 *         so a torn TERMINATED line is a real defect. an unterminated tail is
 *         the one race — an append in flight — and is skipped as not yet written.
 */
export const getOneWarmerCost = async (input: {
  dir: string;
}): Promise<WarmerCost | null> => {
  const raw = await getOneFileText({
    at: path.join(input.dir, NAME_OF_WARMER_ROWS),
  });
  if (raw === null) return null;

  const rows = getAllRowsFromLedger({ raw, dir: input.dir });

  // the measurement is read once, here, and this read is what fails loud on a
  // torn poke. both `hits` and `cost` below then hold a real measurement, so
  // neither can fall back to a nil that no artifact measured
  const poked = getAllPokeMeasurements({ rows, dir: input.dir });

  return {
    pokes: poked.length,
    hits: getOnePokeHitCount({ poked }),
    cost: getOnePokesCost({ poked }),
    faults: getOneFaultCount({ rows }),
    truncated: isWarmerLedgerTruncated({ rows }),
    lastAt: rows.at(-1)?.at ?? null,
  };
};

/**
 * .what = every COMPLETE row of a warmer ledger, parsed, blank lines removed
 * .why = a torn row fails loud with its 1-indexed row number, so a reader can open the
 *        file at the line that broke (rule.forbid.failhide)
 *
 * .note = the writer appends `${row}\n`, so a row is complete only once its newline
 *         lands. an unterminated tail is an append still in flight — a live warmer
 *         races this read — and is skipped, never parsed. a torn line that IS
 *         terminated can be no race, so it still fails loud
 */
const getAllRowsFromLedger = (input: {
  raw: string;
  dir: string;
}): WarmerPokeRow[] =>
  input.raw
    .split('\n')
    .slice(0, -1)
    .filter((line) => line.trim() !== '')
    .map((line, index) => {
      try {
        // .note = the `as` binds field NAMES over a file any hand can edit; it proves
        //         naught about the values. `asPokeMeasurement` below is the gate
        return JSON.parse(line) as WarmerPokeRow;
      } catch (error) {
        // only a torn row is renamed; any other throw surfaces as itself
        throw asWarmerRowParseFault({ error, dir: input.dir, row: index + 1 });
      }
    });

/**
 * .what = the measurements of every poke that spent, each row 1-indexed as the ledger holds it
 * .why = the 1-index rides into `asPokeMeasurement` so a torn row fails loud with the row
 *        number a reader can open the file at
 */
const getAllPokeMeasurements = (input: {
  rows: WarmerPokeRow[];
  dir: string;
}): Array<WarmerPokeMeasured> =>
  input.rows
    .map((row, index) => ({ row, number: index + 1 }))
    .filter((at) => asSpendGrade(at.row.act) === 'known')
    .map((at) => asPokeMeasurement({ ...at, dir: input.dir }));

/**
 * .what = how many of the measured pokes the provider served from cache
 */
const getOnePokeHitCount = (input: {
  poked: Array<WarmerPokeMeasured>;
}): number => input.poked.filter((measured) => measured.hit).length;

/**
 * .what = the summed cost of the measured pokes, a measured nil where none spent
 * .why = `priceSum` of zero terms has no currency to hold, so the nil is stated outright
 */
const getOnePokesCost = (input: {
  poked: Array<WarmerPokeMeasured>;
}): IsoPriceWords =>
  input.poked.length === 0
    ? asIsoPrice({ amount: 0, currency: 'USD' })
    : priceSum(...input.poked.map((measured) => asIsoPrice(measured.cost)));

/**
 * .what = how many attempts faulted — measured naught, and may still have billed
 * .why = read from the act, never from `measured === null` — that predicate is true
 *        of a defer and a retire too, and each of those spent a measured naught
 */
const getOneFaultCount = (input: { rows: WarmerPokeRow[] }): number =>
  input.rows.filter((row) => asSpendGrade(row.act) === 'unknown').length;

/**
 * .what = whether the ledger ends without a terminator
 * .why = the tail, never a count. an append-only ledger ends with a terminator iff
 *        the plan finished, so the absence of one at the end is the whole signal —
 *        and an empty ledger is not truncated, it is a warmer with naught to say yet
 */
const isWarmerLedgerTruncated = (input: { rows: WarmerPokeRow[] }): boolean => {
  const last = input.rows.at(-1);
  if (last === undefined) return false;
  return !isWarmerRowTerminal(last);
};
