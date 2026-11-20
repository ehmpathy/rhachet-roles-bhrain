import type { FulcrumVerdictRow } from '@src/domain.objects/Driver/FulcrumVerdictRow';
import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { asFulcrumDisputeKey } from './asFulcrumDisputeKey';
import type { FulcrumFrontmatter } from './asFulcrumFrontmatter';
import { asRouteFulcrumDisputeState } from './asRouteFulcrumDisputeState';
import type { RouteFulcrum } from './getAllRouteFulcrums';

/**
 * .what = one readable fulcrum, with the frontmatter fields a case varies
 */
const genFulcrum = (input: {
  case: string;
  owed: FulcrumFrontmatter['owed'];
  status?: FulcrumFrontmatter['status'];
  verdict?: FulcrumFrontmatter['verdict'];
  seen?: string;
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
    seen: input.seen ?? 'hash-read',
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
  seen: 'hash-read',
  held: [],
  after: 0,
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
    reopened: string[];
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
      reopened: [],
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
      reopened: [],
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
      reopened: [],
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
      reopened: [],
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
      reopened: [],
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
      reopened: [],
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
      reopened: [],
    },
  },
  {
    description:
      '🔴 an entry edited after the human ruled it owes the human again, read as reopened, never forged',
    given: {
      fulcrums: [
        genFulcrum({
          case: 'F1',
          owed: 'human',
          status: 'ruled',
          verdict: VERDICT_UPHELD,
          seen: 'hash-edited',
        }),
      ],
      rows: [ROW_UPHELD],
    },
    expect: {
      owedHuman: ['F1'],
      ruled: [],
      reflected: [],
      unreadable: [],
      forged: [],
      reopened: ['F1'],
    },
  },
  {
    description:
      'a reflect-owed entry a human ruled is ruled, no longer listed as reflected',
    given: {
      fulcrums: [
        genFulcrum({ case: 'F1', owed: 'reflect', verdict: VERDICT_UPHELD }),
      ],
      rows: [ROW_UPHELD],
    },
    expect: {
      owedHuman: [],
      ruled: ['F1'],
      reflected: [],
      unreadable: [],
      forged: [],
      reopened: [],
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
      reopened: [],
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

/**
 * .what = a live dispute row that cites F1, as the passage log records it
 */
const genDisputeOfF1 = (input: { fulcrum: string }): PassageReport =>
  new PassageReport({
    stone: '1.vision',
    status: 'disputed',
    reviewer: 'rules',
    about: 'blocker.1',
    given: 'r001.rules.md',
    fulcrum: input.fulcrum,
    reason: 'disputed review.peer: rules blocker.1',
  });

describe('asRouteFulcrumDisputeState, a typed field cannot retire a live dispute', () => {
  // the passage log is the one record the driver cannot rewrite in place; a typed `status` or a
  // file rename must not hide a dispute it records. remove the log read and these go red
  test('🔴 a cited entry hand-edited to superseded still owes the human', () => {
    const state = asRouteFulcrumDisputeState({
      fulcrums: [
        genFulcrum({ case: 'F1', owed: 'human', status: 'superseded' }),
      ],
      rows: [],
      reports: [
        genDisputeOfF1({
          fulcrum: '.fulcrums/inventory.of=fulcrums.case=F1-demo.md',
        }),
      ],
    });
    expect(state.owedHuman.map((entry) => entry.frontmatter.case)).toEqual([
      'F1',
    ]);
  });

  test('🔴 a cited entry whose file is gone is named unreadable', () => {
    const state = asRouteFulcrumDisputeState({
      fulcrums: [],
      rows: [],
      reports: [
        genDisputeOfF1({
          fulcrum: '.fulcrums/inventory.of=fulcrums.case=F1-demo.md',
        }),
      ],
    });
    expect(state.unreadable).toEqual([
      {
        path: '.fulcrums/inventory.of=fulcrums.case=F1-demo.md',
        slug: 'F1',
      },
    ]);
  });

  test('a cited entry whose title segment changed is still matched by case', () => {
    const state = asRouteFulcrumDisputeState({
      fulcrums: [genFulcrum({ case: 'F1', owed: 'human' })],
      rows: [],
      reports: [
        genDisputeOfF1({
          fulcrum: '.fulcrums/inventory.of=fulcrums.case=F1-old-title.md',
        }),
      ],
    });
    expect(state.owedHuman.map((entry) => entry.raisedOn)).toEqual([
      ['1.vision'],
    ]);
    expect(state.unreadable).toEqual([]);
  });

  test('a superseded entry whose dispute was rewound lands in no bucket', () => {
    const state = asRouteFulcrumDisputeState({
      fulcrums: [
        genFulcrum({ case: 'F1', owed: 'human', status: 'superseded' }),
      ],
      rows: [],
      reports: [
        genDisputeOfF1({
          fulcrum: '.fulcrums/inventory.of=fulcrums.case=F1-demo.md',
        }),
        new PassageReport({ stone: '1.vision', status: 'rewound' }),
      ],
    });
    expect(state.owedHuman).toEqual([]);
    expect(state.unreadable).toEqual([]);
  });
});

describe('asRouteFulcrumDisputeState, a conceded verdict reaches an end state', () => {
  const fulcrumConceded = genFulcrum({
    case: 'F1',
    owed: 'human',
    status: 'ruled',
    verdict: { by: 'human', at: '2026-11-17', ruled: 'conceded' },
  });
  const dispute = genDisputeOfF1({
    fulcrum: '.fulcrums/inventory.of=fulcrums.case=F1-demo.md',
  });
  const rowConceded: FulcrumVerdictRow = {
    ...ROW_UPHELD,
    ruled: 'conceded',
    held: [asFulcrumDisputeKey({ report: dispute })],
    after: 1,
  };
  const approval = new PassageReport({
    stone: '3.blueprint',
    status: 'approved',
  });

  test('before any approval follows its dispute, the repair is still owed', () => {
    const state = asRouteFulcrumDisputeState({
      fulcrums: [fulcrumConceded],
      rows: [rowConceded],
      reports: [dispute],
    });
    expect(state.ruled.map((entry) => entry.approvedOn)).toEqual([null]);
  });

  test('🔴 an approval after its dispute answers the repair', () => {
    const state = asRouteFulcrumDisputeState({
      fulcrums: [fulcrumConceded],
      rows: [rowConceded],
      reports: [dispute, approval],
    });
    expect(state.ruled.map((entry) => entry.approvedOn)).toEqual([
      '3.blueprint',
    ]);
  });

  // r011 i006 blocker.1: the verdict covers only the disputes the human saw
  test('🔴 a newer dispute on a ruled, unedited case reopens it to the human', () => {
    const state = asRouteFulcrumDisputeState({
      fulcrums: [fulcrumConceded],
      rows: [rowConceded],
      reports: [
        dispute,
        approval,
        new PassageReport({ ...dispute, stone: '5.1.execution' }),
      ],
    });
    expect(state.ruled).toEqual([]);
    expect(state.owedHuman.map((entry) => entry.frontmatter.case)).toEqual([
      'F1',
    ]);
    expect(state.reopened.map((entry) => entry.frontmatter.case)).toEqual([
      'F1',
    ]);
  });

  test('a verdict re-ruled over the newer dispute is ruled again', () => {
    const disputeNewer = new PassageReport({
      ...dispute,
      stone: '5.1.execution',
    });
    const state = asRouteFulcrumDisputeState({
      fulcrums: [fulcrumConceded],
      rows: [
        rowConceded,
        {
          ...rowConceded,
          held: [
            asFulcrumDisputeKey({ report: dispute }),
            asFulcrumDisputeKey({ report: disputeNewer }),
          ],
          after: 3,
        },
      ],
      reports: [dispute, approval, disputeNewer],
    });
    expect(state.ruled.map((entry) => entry.approvedOn)).toEqual([null]);
  });

  // r010 i006 div2: an approval the human gave before the verdict never answers it
  test('🔴 an approval before the verdict does not answer the repair', () => {
    const state = asRouteFulcrumDisputeState({
      fulcrums: [fulcrumConceded],
      rows: [{ ...rowConceded, after: 2 }],
      reports: [dispute, approval],
    });
    expect(state.ruled.map((entry) => entry.approvedOn)).toEqual([null]);
  });

  // r011 i008 blocker.2: a rewind that retires the dispute must not strand the conceded debt
  test('🔴 after a rewind retires its dispute, a later approval still answers the repair', () => {
    const state = asRouteFulcrumDisputeState({
      fulcrums: [fulcrumConceded],
      rows: [rowConceded],
      reports: [
        dispute,
        new PassageReport({ stone: '1.vision', status: 'rewound' }),
        new PassageReport({ stone: '3.blueprint', status: 'approved' }),
      ],
    });
    expect(state.ruled.map((entry) => entry.approvedOn)).toEqual([
      '3.blueprint',
    ]);
  });

  // r011 i006 blocker.2: a rewind can void the approval that answered
  test('🔴 a rewind after the answer voids it, so the repair is owed again', () => {
    const state = asRouteFulcrumDisputeState({
      fulcrums: [fulcrumConceded],
      rows: [rowConceded],
      reports: [
        dispute,
        approval,
        new PassageReport({ stone: '3.blueprint', status: 'rewound' }),
      ],
    });
    expect(state.ruled.map((entry) => entry.approvedOn)).toEqual([null]);
  });
});

// r11 i005 blocker.3: ground and confidence are mutable after a dispute, so the row pins `owed`
describe('asRouteFulcrumDisputeState, the owed a dispute row pinned', () => {
  // the entry now derives `reflect` (wrong ground, 0.95), as a driver edit after the dispute would
  const fulcrumEdited = genFulcrum({ case: 'F1', owed: 'reflect' });
  const asDispute = (input: { owed: 'human' | 'reflect' | undefined }) =>
    new PassageReport({
      stone: '3.blueprint',
      status: 'disputed',
      fulcrum: '.fulcrums/inventory.of=fulcrums.case=F1-demo.md',
      owed: input.owed,
    });

  test('🔴 a row pinned to the human holds the entry owed to the human, and names the edit', () => {
    const state = asRouteFulcrumDisputeState({
      fulcrums: [fulcrumEdited],
      rows: [],
      reports: [asDispute({ owed: 'human' })],
    });
    expect(state.owedHuman.map((entry) => entry.frontmatter.case)).toEqual([
      'F1',
    ]);
    expect(state.reflected).toEqual([]);
    expect(state.owedHuman[0]?.owedEditedSinceDispute).toEqual(true);
  });

  test('a row pinned to a reflection reads the live derive', () => {
    const state = asRouteFulcrumDisputeState({
      fulcrums: [fulcrumEdited],
      rows: [],
      reports: [asDispute({ owed: 'reflect' })],
    });
    expect(state.reflected.map((entry) => entry.frontmatter.case)).toEqual([
      'F1',
    ]);
    expect(state.reflected[0]?.owedEditedSinceDispute).toEqual(false);
  });

  test('a row written before the stamp reads the live derive', () => {
    const state = asRouteFulcrumDisputeState({
      fulcrums: [fulcrumEdited],
      rows: [],
      reports: [asDispute({ owed: undefined })],
    });
    expect(state.reflected.map((entry) => entry.frontmatter.case)).toEqual([
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
        reopened: state.reopened.map((entry) => entry.frontmatter.case),
      }).toEqual(thisCase.expect);
    }),
  );
});
