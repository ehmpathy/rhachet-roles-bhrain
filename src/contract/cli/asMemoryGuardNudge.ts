import type { MemoryGuardAct } from '@src/domain.operations/memory/getMemoryGuardVerdict';

/**
 * .what = owl wisdom for the memory guard halt
 * .why = the bot's urge to remember is good — the nudge honors it, then redirects
 */
const OWL_WISDOM_GUARD = '🦉 hold on, friend — that memory would fade.';

/**
 * .what = the header line for each act the guard blocks
 * .why = the nudge names the act it graded, so a human reads what was seen
 */
const HEADER_OF_ACT: Record<MemoryGuardAct, string> = {
  write: '   ├─ ✋ blocked: write to claude native memory',
  copy: '   ├─ ✋ blocked: a copy beside claude native memory',
  unplaced: '   ├─ ✋ blocked: an unplaced write beside claude native memory',
};

/**
 * .what = the route for a read, for each act that may be a read in truth
 * .why = a cp out of memory, or a redirect to a `$var`, may only read memory;
 *        the nudge names the form that passes
 */
const READ_ROUTE_OF_ACT: Record<'copy' | 'unplaced', string[]> = {
  copy: [
    '   ├─ only a read?',
    '   │  ├─ a cp or mv beside memory blocks, either direction',
    '   │  └─ read it with cat, or redirect to an absolute path outside memory',
    '   │',
  ],
  unplaced: [
    '   ├─ only a read?',
    '   │  ├─ a $var redirect may land in memory',
    '   │  ├─ so may a relative one, with no cwd known',
    '   │  └─ redirect to an absolute path outside memory',
    '   │',
  ],
};

/**
 * .what = render the owl-themed redirect nudge for a blocked memory write
 * .why = pure, so its every shape is pinned by a unit snapshot; the caller writes it
 *        to stderr (rule.forbid.stdout-on-exit-errors) and exits 2
 */
export const asMemoryGuardNudge = (input: {
  path: string;
  act: MemoryGuardAct;
}): string =>
  [
    OWL_WISDOM_GUARD,
    '',
    '📜 memory.guard',
    HEADER_OF_ACT[input.act],
    `   │  └─ ${input.path}`,
    '   │',

    // a copy or an unplaced redirect may be a read in truth, so name its route
    ...(input.act === 'write' ? [] : READ_ROUTE_OF_ACT[input.act]),
    '   ├─ why',
    '   │  └─ ~/.claude memory is machine-local + invisible in git',
    '   │     it will not survive for the next traveler',
    '   │',
    '   ├─ capture it durably instead',
    '   │  ├─ lesson → .agent/repo=.this/role=any/briefs/<name>.md',
    '   │  └─ tactic → .agent/repo=.this/role=any/skills/<name>.sh',
    '   │',
    '   ├─ 🟡 machine-local secrets or paths?',
    '   │  └─ generalize them — keep the raw secret or path out of durable memory',
    '   │',
    '   └─ 🪷 the instinct is right — pave the path for whoever comes next',
  ].join('\n');
