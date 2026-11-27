import { getAllPlotFaults } from './getAllPlotFaults';

const TEST_CASES = [
  {
    description: 'a sound plot has no fault',
    given: [
      { course: 'idempotency', 'builds on': '—' },
      { course: 'retries', 'builds on': 'idempotency' },
    ],
    expect: [],
  },
  {
    description: 'an empty plot is a fault',
    given: [],
    expect: ['the plot names no course; add a row per course to its table'],
  },
  {
    description: 'a slug in backticks or capitals is no kebab slug',
    given: [
      { course: '`idempotency`', 'builds on': '—' },
      { course: 'Retries', 'builds on': '—' },
    ],
    expect: [
      'row 1: course ``idempotency`` is no lowercase kebab slug',
      'row 2: course `Retries` is no lowercase kebab slug',
    ],
  },
  {
    description: 'a twin row is a fault',
    given: [
      { course: 'idempotency', 'builds on': '—' },
      { course: 'idempotency', 'builds on': '—' },
    ],
    expect: ['row 2: course `idempotency` is plotted twice'],
  },
  {
    description: 'a builds-on that names a later or absent course is a fault',
    given: [
      { course: 'retries', 'builds on': 'idempotency' },
      { course: 'idempotency', 'builds on': '—' },
    ],
    expect: [
      'row 1: course `retries` builds on `idempotency`, which no earlier row plots',
    ],
  },
];

describe('getAllPlotFaults', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getAllPlotFaults({ rows: thisCase.given })).toEqual(
        thisCase.expect,
      );
    }),
  );
});
