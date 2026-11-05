import type { TokenBlock } from '@src/domain.objects/Reflector/TokenBlock';
import {
  TokenHeld,
  type TokenTier,
} from '@src/domain.objects/Reflector/TokenHeld';
import type { TranscriptCall } from '@src/domain.objects/Reflector/TranscriptCall';

import { asCallContext } from './asCallContext';
import { asTokenAllocation } from './asTokenAllocation';

/**
 * .what = a point where the context re-based: a compaction, or a shrink no marker explains
 * .why = blocks held before it end there, and the report names each one with its call
 */
export interface ContextRebase {
  ordinal: number;
  cause: 'compaction' | 'shrink';
  from: number;
  to: number;
}

/**
 * .what = attributes every token of a session's context to the block that put it there
 * .why = `usage` says how big each prompt was, never what it held. the deltas between
 *        consecutive calls say what arrived; each delta is split across what arrived in it
 *
 * the rule, per delta:
 * - the prior call's `output_tokens` → `assistant.own` (measured)
 * - the remainder → the blocks that arrived: one category → `exact`; several → by byte share
 *   (`apportioned`); none → `unattributed`
 * - the base (call 1, or the first call after a re-base) → arrivals at a tokens-per-byte
 *   ratio calibrated from this transcript's own exact deltas, capped at the base; the rest
 *   `unattributed` (the system prompt and tool schemas, which no record carries)
 *
 * .note = rows always sum to the measured context of the last call, by construction
 * .note = deliberate mutation: one linear walk keeps the held list local; output is immutable
 */
export const getOneTokenInventory = (input: {
  calls: TranscriptCall[];
}): {
  held: TokenHeld[];
  rebases: ContextRebase[];
  tokensPerByte: number | null;
} => {
  const calls = input.calls.filter((call) => call.isMainThread);
  const tokensPerByte = getTokensPerByte({ calls });

  const held: TokenHeld[] = [];
  const rebases: ContextRebase[] = [];
  let heldFrom = 0; // index into `held` of the first block still in context

  for (let index = 0; index < calls.length; index++) {
    const call = calls[index]!;
    const prior = index > 0 ? calls[index - 1]! : null;
    const context = asCallContext({ call });
    const contextPrior = prior ? asCallContext({ call: prior }) : 0;

    // a compaction or an unexplained shrink ends every held block and re-bases the context
    const isShrink = prior !== null && context < contextPrior;
    const isRebase = prior === null || call.isAfterCompaction || isShrink;
    if (isRebase) {
      for (let heldIndex = heldFrom; heldIndex < held.length; heldIndex++)
        held[heldIndex] = new TokenHeld({
          ...held[heldIndex]!,
          endedAt: index,
        });
      heldFrom = held.length;
      if (prior)
        rebases.push({
          ordinal: call.ordinal,
          cause: call.isAfterCompaction ? 'compaction' : 'shrink',
          from: contextPrior,
          to: context,
        });
      held.push(
        ...asBaseHeld({
          base: context,
          arrivals: call.arrivals,
          tokensPerByte,
          arrivedAt: index,
          remainderLabel: asBaseRemainderLabel({ prior, call, isShrink }),
        }),
      );
      continue;
    }

    // the prior call's own output is the first part of the delta, measured
    const delta = context - contextPrior;
    const own = Math.min(prior.spend.output, delta);
    if (own > 0)
      held.push(
        new TokenHeld({
          category: 'assistant.own',
          label: 'assistant',
          tier: 'measured',
          tokens: own,
          arrivedAt: index,
          endedAt: null,
        }),
      );

    // the remainder is split across what arrived
    held.push(
      ...asDeltaHeld({
        tokens: delta - own,
        arrivals: call.arrivals,
        arrivedAt: index,
      }),
    );
  }

  return { held, rebases, tokensPerByte };
};

/**
 * .what = the held blocks a delta's remainder becomes
 * .why = the tier follows from how many categories shared the delta
 */
const asDeltaHeld = (input: {
  tokens: number;
  arrivals: TokenBlock[];
  arrivedAt: number;
}): TokenHeld[] => {
  if (input.tokens <= 0) return [];
  const bytes = input.arrivals.reduce((sum, block) => sum + block.bytes, 0);

  // no record explains the growth: it is harness text no transcript carries
  if (bytes === 0)
    return [
      new TokenHeld({
        category: 'unattributed',
        label: 'harness',
        tier: 'unattributed',
        tokens: input.tokens,
        arrivedAt: input.arrivedAt,
        endedAt: null,
      }),
    ];

  // one category takes the whole remainder; several share it by bytes
  const categories = new Set(input.arrivals.map((block) => block.category));
  const tier: TokenTier = categories.size === 1 ? 'exact' : 'apportioned';
  return asHeldByBytes({
    tokens: input.tokens,
    arrivals: input.arrivals,
    tier,
    arrivedAt: input.arrivedAt,
  });
};

/**
 * .what = the held blocks of a base context: arrivals at the calibrated ratio, the rest
 *         unattributed
 * .why = at a base there is no prior call to subtract, so the delta is the whole prompt —
 *        system prompt and tool schemas included, which no record holds
 */
const asBaseHeld = (input: {
  base: number;
  arrivals: TokenBlock[];
  tokensPerByte: number | null;
  arrivedAt: number;
  remainderLabel: string;
}): TokenHeld[] => {
  const bytes = input.arrivals.reduce((sum, block) => sum + block.bytes, 0);
  const estimate =
    input.tokensPerByte === null
      ? 0
      : Math.min(input.base, Math.round(bytes * input.tokensPerByte));
  const remainder = input.base - estimate;

  // the remainder leads: the system prompt and tool schemas sit at the front of the
  // prompt, ahead of every record, so the cache-read span covers them first
  return [
    ...(remainder > 0
      ? [
          new TokenHeld({
            category: 'unattributed',
            label: input.remainderLabel,
            tier: 'unattributed',
            tokens: remainder,
            arrivedAt: input.arrivedAt,
            endedAt: null,
          }),
        ]
      : []),
    ...asHeldByBytes({
      tokens: estimate,
      arrivals: input.arrivals,
      tier: 'apportioned',
      arrivedAt: input.arrivedAt,
    }),
  ];
};

/**
 * .what = the label of a base's unexplained remainder
 * .why = the remainder at call 1 is the harness; after a re-base it also holds what the
 *        harness carried over, and a reader must see which
 */
const asBaseRemainderLabel = (input: {
  prior: TranscriptCall | null;
  call: TranscriptCall;
  isShrink: boolean;
}): string => {
  if (input.prior === null) return 'harness (system prompt + tool schemas)';
  if (input.call.isAfterCompaction) return 'harness + compacted context';
  return 'context shrink (unexplained)';
};

/**
 * .what = splits tokens across blocks by byte share, one held block per category·label
 * .why = blocks of one label in one delta are one row; the split keeps the sum exact
 * .note = deliberate mutation: the per-key byte map is local to this call; output is fresh
 */
const asHeldByBytes = (input: {
  tokens: number;
  arrivals: TokenBlock[];
  tier: TokenTier;
  arrivedAt: number;
}): TokenHeld[] => {
  if (input.tokens <= 0) return [];

  // merge blocks of one category·label
  const bytesByKey = new Map<string, { block: TokenBlock; bytes: number }>();
  for (const block of input.arrivals) {
    const key = `${block.category}\u0000${block.label}`;
    const extant = bytesByKey.get(key);
    bytesByKey.set(key, { block, bytes: (extant?.bytes ?? 0) + block.bytes });
  }
  const groups = [...bytesByKey.values()].filter((group) => group.bytes > 0);

  // allocate in integers, with no token lost
  const tokens = asTokenAllocation({
    total: input.tokens,
    weights: groups.map((group) => group.bytes),
  });
  return groups
    .map(
      (group, index) =>
        new TokenHeld({
          category: group.block.category,
          label: group.block.label,
          tier: input.tier,
          tokens: tokens[index]!,
          arrivedAt: input.arrivedAt,
          endedAt: null,
        }),
    )
    .filter((entry) => entry.tokens > 0);
};

/**
 * .what = the median tokens-per-byte of this transcript's single-category deltas
 * .why = a base has no prior call, so its arrivals need a ratio. the deltas where one
 *        category arrived alone measure that ratio from this very transcript — never chars/4
 * .note = deliberate mutation: the ratio list is local to this call and read once
 */
const getTokensPerByte = (input: {
  calls: TranscriptCall[];
}): number | null => {
  const ratios: number[] = [];
  for (let index = 1; index < input.calls.length; index++) {
    const call = input.calls[index]!;
    const prior = input.calls[index - 1]!;
    if (call.isAfterCompaction) continue;
    const categories = new Set(call.arrivals.map((block) => block.category));
    if (categories.size !== 1) continue;
    const bytes = call.arrivals.reduce((sum, block) => sum + block.bytes, 0);
    const delta = asCallContext({ call }) - asCallContext({ call: prior });
    const rest = delta - Math.min(prior.spend.output, delta);
    if (bytes < 256 || rest <= 0) continue;
    ratios.push(rest / bytes);
  }
  if (ratios.length === 0) return null;
  const sorted = [...ratios].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
};
