import { asTreeReadsSplit, type ReviewTreeRead } from './asTreeReadsSplit';

const asTree = (name: string) => ({
  name,
  dir: `/grove/${name}`,
  root: `/grove/${name}/.log/bhrain/review`,
  present: true,
});

const TEST_CASES: {
  description: string;
  given: { reads: ReviewTreeRead[] };
  expect: ReturnType<typeof asTreeReadsSplit>;
}[] = [
  {
    description: 'no reads → no readable, no unreadable',
    given: { reads: [] },
    expect: { readable: [], unreadable: [] },
  },
  {
    description:
      'a read with no fault is readable; a read with a fault is unreadable, named by tree',
    given: {
      reads: [
        {
          tree: asTree('alpha'),
          read: { runs: [], fault: null, denial: null },
        },
        {
          tree: asTree('beta'),
          read: { runs: [], fault: 'EACCES: barred', denial: 'EACCES' },
        },
        {
          tree: asTree('gamma'),
          read: { runs: [], fault: 'the log root vanished', denial: null },
        },
      ],
    },
    expect: {
      readable: [{ tree: asTree('alpha'), runs: [] }],
      unreadable: [
        { tree: 'beta', fault: 'EACCES: barred' },
        { tree: 'gamma', fault: 'the log root vanished' },
      ],
    },
  },
  {
    description: 'tree order is kept within each list',
    given: {
      reads: [
        { tree: asTree('zeta'), read: { runs: [], fault: null, denial: null } },
        { tree: asTree('eta'), read: { runs: [], fault: null, denial: null } },
      ],
    },
    expect: {
      readable: [
        { tree: asTree('zeta'), runs: [] },
        { tree: asTree('eta'), runs: [] },
      ],
      unreadable: [],
    },
  },
];

describe('asTreeReadsSplit', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asTreeReadsSplit(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
