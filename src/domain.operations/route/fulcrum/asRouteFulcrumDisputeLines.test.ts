import type { FulcrumFrontmatter } from './asFulcrumFrontmatter';
import { asRouteFulcrumCommandRows } from './asRouteFulcrumCommandRows';
import { asRouteFulcrumDisputeLines } from './asRouteFulcrumDisputeLines';
import type {
  RouteFulcrumDisputeEntry,
  RouteFulcrumDisputeState,
} from './asRouteFulcrumDisputeState';
import { getAllRouteFulcrumRuleCommands } from './getAllRouteFulcrumRuleCommands';
import { isRouteFulcrumDisputeStateBlocked } from './isRouteFulcrumDisputeStateBlocked';

/**
 * .what = one dispute entry, with frontmatter defaults overridable per case
 */
const genEntry = (input: {
  case: string;
  title: string;
  frontmatter: Partial<FulcrumFrontmatter>;
  raisedOn: string[];
}): RouteFulcrumDisputeEntry => ({
  path: `.fulcrums/inventory.of=fulcrums.case=${input.case}-${input.title}.md`,
  title: input.title,
  raisedOn: input.raisedOn,
  frontmatter: {
    case: input.case,
    rework: 'clean',
    ground: 'wrong',
    confidence: 0.65,
    status: 'open',
    owed: 'human',
    holds: ['rules/i003/blocker.2'],
    lean: 'keep the table as written',
    reflect: null,
    verdict: null,
    ...input.frontmatter,
  },
});

const ENTRY_OWED = genEntry({
  case: 'F44',
  title: 'rename-table',
  frontmatter: {},
  raisedOn: ['3.blueprint'],
});
const ENTRY_RULED = genEntry({
  case: 'F47',
  title: 'cache-scope',
  frontmatter: {
    status: 'ruled',
    verdict: { by: 'human', at: '2026-11-17', ruled: 'conceded' },
  },
  raisedOn: [],
});
const ENTRY_REFLECTED = genEntry({
  case: 'F45',
  title: 'sure-misread',
  frontmatter: {
    confidence: 0.95,
    owed: 'reflect',
    reflect: 'ehmpathy/rhachet#1',
  },
  raisedOn: [],
});

const STATE_EMPTY: RouteFulcrumDisputeState = {
  owedHuman: [],
  ruled: [],
  reflected: [],
  unreadable: [],
  forged: [],
};

const STATE_FULL: RouteFulcrumDisputeState = {
  owedHuman: [ENTRY_OWED],
  ruled: [ENTRY_RULED],
  reflected: [ENTRY_REFLECTED],
  unreadable: [
    { slug: 'F46', path: '.fulcrums/inventory.of=fulcrums.case=F46-bare.md' },
  ],
  forged: [ENTRY_OWED],
};

describe('asRouteFulcrumDisputeLines', () => {
  test('an empty state renders no lines', () => {
    expect(asRouteFulcrumDisputeLines({ state: STATE_EMPTY })).toEqual([]);
  });

  test('every section renders, owed first, each fact on its own leaf', () => {
    const lines = asRouteFulcrumDisputeLines({ state: STATE_FULL });
    expect(lines.join('\n')).toContain('F44 · rename-table · 65%');
    expect(lines.join('\n')).toContain('raised on: 3.blueprint');
    expect(lines.join('\n')).toContain('no human lever wrote');
    expect(lines.join('\n')).toContain('F46 · .fulcrums/');
    expect(lines.join('\n')).toContain(
      'F47 · cache-scope · conceded, repair owed',
    );
    expect(lines.join('\n')).toContain('reflect: ehmpathy/rhachet#1');
    expect(lines.join('\n')).toMatchSnapshot();
  });
});

describe('isRouteFulcrumDisputeStateBlocked', () => {
  const TEST_CASES: {
    description: string;
    given: { state: RouteFulcrumDisputeState };
    expect: { output: boolean };
  }[] = [
    {
      description: 'an empty state holds no gate',
      given: { state: STATE_EMPTY },
      expect: { output: false },
    },
    {
      description: 'an open human-owed dispute holds the gate',
      given: { state: { ...STATE_EMPTY, owedHuman: [ENTRY_OWED] } },
      expect: { output: true },
    },
    {
      description: 'an unreadable entry holds the gate',
      given: { state: { ...STATE_EMPTY, unreadable: STATE_FULL.unreadable } },
      expect: { output: true },
    },
    {
      description: 'ruled and reflected entries alone hold no gate',
      given: {
        state: {
          ...STATE_EMPTY,
          ruled: [ENTRY_RULED],
          reflected: [ENTRY_REFLECTED],
        },
      },
      expect: { output: false },
    },
  ];
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isRouteFulcrumDisputeStateBlocked(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});

describe('getAllRouteFulcrumRuleCommands', () => {
  test('one rule command per owed dispute, none for ruled or reflected', () => {
    expect(getAllRouteFulcrumRuleCommands({ state: STATE_FULL })).toEqual([
      'rhx route.fulcrum.rule --case F44 --as upheld|conceded',
    ]);
  });
});

describe('asRouteFulcrumCommandRows', () => {
  test('each command is a branch, the last one closes the tree', () => {
    expect(asRouteFulcrumCommandRows({ commands: ['rhx a', 'rhx b'] })).toEqual(
      ['├─ rhx a', '└─ rhx b'],
    );
  });
});
