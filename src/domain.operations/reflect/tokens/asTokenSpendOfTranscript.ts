import type { TokenRates } from '@src/domain.objects/Reflector/TokenRates';
import {
  type TokenSpendInventoryRow,
  type TokenSpendRepaidRow,
  TokenSpendReport,
} from '@src/domain.objects/Reflector/TokenSpendReport';
import type { TranscriptCall } from '@src/domain.objects/Reflector/TranscriptCall';

import { asCallContext } from './asCallContext';
import { asGroupsByKey } from './asGroupsByKey';
import { asTokenPrice } from './asTokenPrice';
import { asTokenPriceSum } from './asTokenPriceSum';
import { asTokenRepaidTotal } from './asTokenRepaidTotal';
import { getOneTokenInventory } from './getOneTokenInventory';
import { getOneTokenRepaid } from './getOneTokenRepaid';

/**
 * .what = the token spend report of one transcript, from its calls and its models' rates
 * .why = composes the three readings — efficiency (how much), inventory (on what), and
 *        repaid (what each part cost to keep) — into one report a formatter can render
 */
export const asTokenSpendOfTranscript = (input: {
  path: string;
  chosenBy: string;
  subagentOf: string | null;
  calls: TranscriptCall[];
  partialLinesSkipped: number;
  ratesByModel: Map<string, TokenRates>;
  subagents: { path: string; calls: TranscriptCall[] }[];
}): TokenSpendReport => {
  const mainCalls = input.calls.filter((call) => call.isMainThread);
  const { held, rebases, tokensPerByte } = getOneTokenInventory({
    calls: mainCalls,
  });
  const repaid = getOneTokenRepaid({ calls: mainCalls, held });
  const sessionRates = asSessionRates({
    mainCalls,
    ratesByModel: input.ratesByModel,
  });

  // inventory: the blocks held at the last call, per category
  const heldAtEnd = held.filter((entry) => entry.endedAt === null);
  const inventory = asInventoryRows({ held: heldAtEnd });

  // repaid: per category·label, priced at the session's model
  const repaidRows = asRepaidRows({
    repaid,
    mainCalls,
    rates: sessionRates,
  });

  return new TokenSpendReport({
    transcripts: [
      {
        path: input.path,
        chosenBy: input.chosenBy,
        subagentOf: input.subagentOf,
      },
    ],
    skipped: [],
    notes: asInventoryNotes({ held: heldAtEnd }),
    partialLinesSkipped: input.partialLinesSkipped,
    calls: input.calls.length,
    efficiency: asEfficiency({
      calls: input.calls,
      ratesByModel: input.ratesByModel,
    }),
    contextPerCall: asContextPerCall({ calls: mainCalls }),
    inventory,
    repaid: repaidRows,
    rebases: rebases.map((rebase) => ({
      transcript: input.path,
      call: rebase.ordinal,
      cause: rebase.cause,
      from: rebase.from,
      to: rebase.to,
    })),
    subagents: input.subagents.map((subagent) =>
      asSubagentRow({ subagent, ratesByModel: input.ratesByModel }),
    ),
    tokensPerByte,
  });
};

/**
 * .what = one subagent's row: its call count, its total tokens, and their price
 * .why = a subagent is its own spend; the parent lists it, never folds it in
 */
const asSubagentRow = (input: {
  subagent: { path: string; calls: TranscriptCall[] };
  ratesByModel: Map<string, TokenRates>;
}): TokenSpendReport['subagents'][number] => {
  const efficiency = asEfficiency({
    calls: input.subagent.calls,
    ratesByModel: input.ratesByModel,
  });
  return {
    path: input.subagent.path,
    calls: input.subagent.calls.length,
    tokens:
      efficiency.inputRaw +
      efficiency.cacheRead +
      efficiency.cacheWrite5m +
      efficiency.cacheWrite1h +
      efficiency.output,
    priced: efficiency.priced,
  };
};

/**
 * .what = the measured token totals across every call, priced per call's model
 * .why = efficiency counts every metered call — main thread, sidechain, or other model
 */
const asEfficiency = (input: {
  calls: TranscriptCall[];
  ratesByModel: Map<string, TokenRates>;
}): TokenSpendReport['efficiency'] => {
  const models = [...new Set(input.calls.map((call) => call.model))];

  // sum token kinds per model, then price each model's sum once
  const perModel = models.map((model) => {
    const calls = input.calls.filter((call) => call.model === model);
    const tokens = {
      input: calls.reduce((sum, call) => sum + call.spend.inputRaw, 0),
      output: calls.reduce((sum, call) => sum + call.spend.output, 0),
      cacheRead: calls.reduce((sum, call) => sum + call.spend.cacheRead, 0),
      cacheWrite1h: calls.reduce(
        (sum, call) => sum + (call.spend.cacheWrite.ttl1h ?? 0),
        0,
      ),
      cacheWrite5m: calls.reduce(
        (sum, call) =>
          sum +
          call.spend.cacheWrite.total -
          (call.spend.cacheWrite.ttl1h ?? 0),
        0,
      ),
    };
    return {
      tokens,
      priced: asTokenPrice({
        tokens,
        rates: input.ratesByModel.get(model) ?? null,
      }),
    };
  });

  return {
    inputRaw: perModel.reduce((sum, entry) => sum + entry.tokens.input, 0),
    cacheRead: perModel.reduce((sum, entry) => sum + entry.tokens.cacheRead, 0),
    cacheWrite5m: perModel.reduce(
      (sum, entry) => sum + entry.tokens.cacheWrite5m,
      0,
    ),
    cacheWrite1h: perModel.reduce(
      (sum, entry) => sum + entry.tokens.cacheWrite1h,
      0,
    ),
    output: perModel.reduce((sum, entry) => sum + entry.tokens.output, 0),
    priced: asTokenPriceSum({ parts: perModel.map((entry) => entry.priced) }),
    models,
  };
};

/**
 * .what = the rates of the session's model — the model of the main-thread calls
 * .why = repaid rows price the main thread's context, so they take its model's rates
 */
const asSessionRates = (input: {
  mainCalls: TranscriptCall[];
  ratesByModel: Map<string, TokenRates>;
}): TokenRates | null => {
  const sessionModel = input.mainCalls[0]?.model ?? null;
  if (sessionModel === null) return null;
  return input.ratesByModel.get(sessionModel) ?? null;
};

/**
 * .what = the median and the peak context size across the main-thread calls
 * .why = a typical call's size and the worst one bound what each call re-paid
 */
const asContextPerCall = (input: {
  calls: TranscriptCall[];
}): TokenSpendReport['contextPerCall'] => {
  const contexts = input.calls
    .map((call) => asCallContext({ call }))
    .sort((a, b) => a - b);
  if (contexts.length === 0) return null;
  return {
    median: contexts[Math.floor(contexts.length / 2)]!,
    peak: contexts[contexts.length - 1]!,
  };
};

/**
 * .what = the caveats a reader needs to read the inventory right
 * .why = a base with no `boot.instructions` row does not mean the boot was free — its
 *        bytes sit inside `unattributed`, and a reader must not rank a cut on a zero
 */
const asInventoryNotes = (input: {
  held: { category: TokenSpendInventoryRow['category'] }[];
}): string[] => {
  const isBootSeen = input.held.some(
    (entry) => entry.category === 'boot.instructions',
  );
  if (isBootSeen) return [];
  return [
    'no boot.instructions block was seen; the boot share sits inside unattributed',
  ];
};

/**
 * .what = the held blocks at the last call, summed per category and per label within it
 * .why = the inventory is a snapshot of the last call's context, by what it held
 */
const asInventoryRows = (input: {
  held: {
    category: TokenSpendInventoryRow['category'];
    label: string;
    tier: TokenSpendInventoryRow['tiers'][number];
    tokens: number;
  }[];
}): TokenSpendInventoryRow[] => {
  return asGroupsByKey({ items: input.held, keyOf: (entry) => entry.category })
    .map((entries) => {
      const labels = asGroupsByKey({ items: entries, keyOf: (e) => e.label })
        .map((ofLabel) => ({
          label: ofLabel[0]!.label,
          tokens: ofLabel.reduce((sum, entry) => sum + entry.tokens, 0),
        }))
        .sort((a, b) => b.tokens - a.tokens);
      return {
        category: entries[0]!.category,
        tokens: entries.reduce((sum, entry) => sum + entry.tokens, 0),
        tiers: [...new Set(entries.map((entry) => entry.tier))].sort(),
        labels,
        spread: null,
      };
    })
    .sort((a, b) => b.tokens - a.tokens);
};

/**
 * .what = the repaid rows, per category·label, each priced and with its peak block
 * .why = the proposal ranks targets by repaid cost; the peak names the one block that
 *        drove a row (the log read once and re-paid a thousand times)
 */
const asRepaidRows = (input: {
  repaid: ReturnType<typeof getOneTokenRepaid>;
  mainCalls: TranscriptCall[];
  rates: TokenRates | null;
}): TokenSpendRepaidRow[] => {
  return asGroupsByKey({
    items: input.repaid,
    keyOf: (row) => `${row.held.category}\u0000${row.held.label}`,
  })
    .map((rows) => {
      const first = rows[0]!;
      const tokens = {
        cacheRead: rows.reduce((sum, row) => sum + row.tokens.cacheRead, 0),
        cacheWrite5m: rows.reduce(
          (sum, row) => sum + row.tokens.cacheWrite5m,
          0,
        ),
        cacheWrite1h: rows.reduce(
          (sum, row) => sum + row.tokens.cacheWrite1h,
          0,
        ),
        input: rows.reduce((sum, row) => sum + row.tokens.input, 0),
      };
      const peakRow = [...rows].sort(
        (a, b) => b.held.tokens * b.calls - a.held.tokens * a.calls,
      )[0]!;
      return {
        category: first.held.category,
        label: first.held.label,
        tokens,
        priced: asTokenPrice({
          tokens: { ...tokens, output: 0 },
          rates: input.rates,
        }),
        peak: {
          arrivedAtCall: input.mainCalls[peakRow.held.arrivedAt]?.ordinal ?? 0,
          tokens: peakRow.held.tokens,
          calls: peakRow.calls,
        },
      };
    })
    .filter((row) => asTokenRepaidTotal({ tokens: row.tokens }) > 0);
};
