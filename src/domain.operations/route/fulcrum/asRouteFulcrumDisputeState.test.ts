import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import type { FulcrumFrontmatter } from './asFulcrumFrontmatter';
import { asRouteFulcrumDisputeState } from './asRouteFulcrumDisputeState';
import type { FulcrumVerdictRow } from './getAllFulcrumVerdictRows';
import type { RouteFulcrum } from './getAllRouteFulcrums';

/**
 * .what = one readable fulcrum, with the frontmatter fields a case varies
 */
const genFulcrum = (input: {
  case: string;
  owed: FulcrumFrontmatter['owed'];
  status?: FulcrumFrontmatter['status'];
  verdict?: FulcrumFrontmatter['verdict'];
}): RouteFulcrum => ({
  path: `.fulcrums/inventory.of=fulcrums.case=${input.case}-demo.md`,
  slug: input.case,
  title: 'demo',
  parse: {
    kind: 'valid',
    frontmatter: {
      case: input.case,
      rework: 'clean',
      ground: input.owed === 'reflect' ? 'wrong' : 'dirty',
      confidence: input.owed === 'reflect' ? 0.95 : 0.7,
      status: input.status ?? 'open',
      owed: input.owed,
      holds: ['rules/i001/blocker.1'],
      lean: 'x',
      reflect: input.owed === 'reflect' ? 'ehmpathy/demo#1' : null,
      verdict: input.verdict ?? null,
    },
  },
});

const VERDICT_UPHELD = {
  by: 'human',
  at: '2026-11-17',
  ruled: 'upheld',
} as const;
const ROW_UPHELD: FulcrumVerdictRow = {
  case: 'F1',
  ruled: 'upheld',
  on: '2026-11-17',
};

/**
 * .what = the cases each bucket's membership turns on
 * .why = every gate funnels through this one classifier; each row is a cell a gate relies on
 */
const TEST_CASES: {
  description: string;
  given: { fulcrums: RouteFulcrum[]; rows: FulcrumVerdictRow[] };
  expect: {
    owedHuman: string[];
    ruled: string[];
    reflected: string[];
    unreadable: string[];
    forged: string[];
  };
}[] = [
  {
    description: 'an open human-owed dispute is owed',
    given: { fulcrums: [genFulcrum({ case: 'F1', owed: 'human' })], rows: [] },
    expect: {
      owedHuman: ['F1'],
      ruled: [],
      reflected: [],
      unreadable: [],
      forged: [],
    },
  },
  {
    description: 'a human-owed verdict the ledger proves is ruled, never owed',
    given: {
      fulcrums: [
        genFulcrum({
          case: 'F1',
          owed: 'human',
          status: 'ruled',
          verdict: VERDICT_UPHELD,
        }),
      ],
      rows: [ROW_UPHELD],
    },
    expect: {
      owedHuman: [],
      ruled: ['F1'],
      reflected: [],
      unreadable: [],
      forged: [],
    },
  },
  {
    description: 'a superseded entry lands in no bucket',
    given: {
      fulcrums: [
        genFulcrum({ case: 'F1', owed: 'human', status: 'superseded' }),
      ],
      rows: [],
    },
    expect: {
      owedHuman: [],
      ruled: [],
      reflected: [],
      unreadable: [],
      forged: [],
    },
  },
  {
    description: 'an owes-none entry stays out of owed and reflected',
    given: {
      fulcrums: [genFulcrum({ case: 'F1', owed: 'none', status: 'held' })],
      rows: [],
    },
    expect: {
      owedHuman: [],
      ruled: [],
      reflected: [],
      unreadable: [],
      forged: [],
    },
  },
  {
    description: 'a write-in verdict on an owes-none entry is still forged',
    given: {
      fulcrums: [
        genFulcrum({ case: 'F1', owed: 'none', verdict: VERDICT_UPHELD }),
      ],
      rows: [],
    },
    expect: {
      owedHuman: [],
      ruled: [],
      reflected: [],
      unreadable: [],
      forged: ['F1'],
    },
  },
  {
    description:
      'a reflect-owed entry with no verdict is listed apart, never owed',
    given: {
      fulcrums: [genFulcrum({ case: 'F1', owed: 'reflect' })],
      rows: [],
    },
    expect: {
      owedHuman: [],
      ruled: [],
      reflected: ['F1'],
      unreadable: [],
      forged: [],
    },
  },
  {
    description:
      'a hand-written verdict on a human-owed entry is forged and still owed',
    given: {
      fulcrums: [
        genFulcrum({ case: 'F1', owed: 'human', verdict: VERDICT_UPHELD }),
      ],
      rows: [],
    },
    expect: {
      owedHuman: ['F1'],
      ruled: [],
      reflected: [],
      unreadable: [],
      forged: ['F1'],
    },
  },
  {
    description: 'an unreadable entry is named, never skipped',
    given: {
      fulcrums: [
        {
          path: '.fulcrums/inventory.of=fulcrums.case=F1-demo.md',
          slug: 'F1',
          title: 'demo',
          parse: { kind: 'absent' },
        },
      ],
      rows: [],
    },
    expect: {
      owedHuman: [],
      ruled: [],
      reflected: [],
      unreadable: ['F1'],
      forged: [],
    },
  },
];

describe('asRouteFulcrumDisputeState, a disputed entry hand-edited to owe none', () => {
  // the dispute path checks owed against ground × confidence once; a later hand edit must not
  // route the dispute away from the gate. remove the derived read and this case goes red
  test('🔴 it still owes the human, as its ground and confidence derive', () => {
    const state = asRouteFulcrumDisputeState({
      fulcrums: [genFulcrum({ case: 'F1', owed: 'none' })],
      rows: [],
      reports: [
        new PassageReport({
          stone: '1.vision',
          status: 'disputed',
          reviewer: 'rules',
          about: 'blocker.1',
          given: 'r001.rules.md',
          fulcrum: '.fulcrums/inventory.of=fulcrums.case=F1-demo.md',
          reason: 'disputed review.peer: rules blocker.1',
        }),
      ],
    });
    expect(state.owedHuman.map((entry) => entry.frontmatter.case)).toEqual([
      'F1',
    ]);
  });
});

describe('asRouteFulcrumDisputeState', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const state = asRouteFulcrumDisputeState({
        fulcrums: thisCase.given.fulcrums,
        rows: thisCase.given.rows,
        reports: [],
      });
      expect({
        owedHuman: state.owedHuman.map((entry) => entry.frontmatter.case),
        ruled: state.ruled.map((entry) => entry.frontmatter.case),
        reflected: state.reflected.map((entry) => entry.frontmatter.case),
        unreadable: state.unreadable.map((entry) => entry.slug),
        forged: state.forged.map((entry) => entry.frontmatter.case),
      }).toEqual(thisCase.expect);
    }),
  );
});
