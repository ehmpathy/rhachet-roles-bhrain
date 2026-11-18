import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { asFulcrumRaisedOnStones } from './asFulcrumRaisedOnStones';

const FULCRUM_F44 = 'inventory.of=fulcrums.case=F44-rename-table.md';

const TEST_CASES = [
  {
    description: 'maps a dispute to the stone it was raised on, by case id',
    given: {
      reports: [
        new PassageReport({
          stone: '3.blueprint',
          status: 'disputed',
          fulcrum: `.fulcrums/${FULCRUM_F44}`,
        }),
      ],
    },
    expect: {
      output: [
        ['F44', { stones: ['3.blueprint'], path: `.fulcrums/${FULCRUM_F44}` }],
      ],
    },
  },
  {
    description:
      'keys by case id, so a route-relative and a repo-relative path meet',
    given: {
      reports: [
        new PassageReport({
          stone: '3.blueprint',
          status: 'disputed',
          fulcrum: `.fulcrums/${FULCRUM_F44}`,
        }),
        new PassageReport({
          stone: '5.1.execution',
          status: 'disputed',
          fulcrum: `.behavior/v2026_11_16.demo/.fulcrums/${FULCRUM_F44}`,
        }),
      ],
    },
    expect: {
      output: [
        [
          'F44',
          {
            stones: ['3.blueprint', '5.1.execution'],
            path: `.fulcrums/${FULCRUM_F44}`,
          },
        ],
      ],
    },
  },
  {
    description:
      '🔴 clamp. keys by case id, so a change to the title segment cannot orphan a dispute',
    given: {
      reports: [
        new PassageReport({
          stone: '3.blueprint',
          status: 'disputed',
          fulcrum: '.fulcrums/inventory.of=fulcrums.case=F44-old-title.md',
        }),
      ],
    },
    expect: {
      output: [
        [
          'F44',
          {
            stones: ['3.blueprint'],
            path: '.fulcrums/inventory.of=fulcrums.case=F44-old-title.md',
          },
        ],
      ],
    },
  },
  {
    description: 'names a stone once, however many disputes it raised there',
    given: {
      reports: [
        new PassageReport({
          stone: '3.blueprint',
          status: 'disputed',
          fulcrum: `.fulcrums/${FULCRUM_F44}`,
        }),
        new PassageReport({
          stone: '3.blueprint',
          status: 'disputed',
          fulcrum: `.fulcrums/${FULCRUM_F44}`,
        }),
      ],
    },
    expect: {
      output: [
        ['F44', { stones: ['3.blueprint'], path: `.fulcrums/${FULCRUM_F44}` }],
      ],
    },
  },
  {
    description:
      '🔴 clamp. a later rewind of the stone retires its dispute; a rewind of another stone does not',
    given: {
      reports: [
        new PassageReport({
          stone: '3.blueprint',
          status: 'disputed',
          fulcrum: `.fulcrums/${FULCRUM_F44}`,
        }),
        new PassageReport({
          stone: '5.1.execution',
          status: 'disputed',
          fulcrum: `.fulcrums/${FULCRUM_F44}`,
        }),
        new PassageReport({ stone: '3.blueprint', status: 'rewound' }),
      ],
    },
    expect: {
      output: [
        [
          'F44',
          { stones: ['5.1.execution'], path: `.fulcrums/${FULCRUM_F44}` },
        ],
      ],
    },
  },
  {
    description: 'a dispute raised after a rewind of its stone stays live',
    given: {
      reports: [
        new PassageReport({ stone: '3.blueprint', status: 'rewound' }),
        new PassageReport({
          stone: '3.blueprint',
          status: 'disputed',
          fulcrum: `.fulcrums/${FULCRUM_F44}`,
        }),
      ],
    },
    expect: {
      output: [
        ['F44', { stones: ['3.blueprint'], path: `.fulcrums/${FULCRUM_F44}` }],
      ],
    },
  },
  {
    description:
      'skips rows that are no dispute, and disputes that cite no file',
    given: {
      reports: [
        new PassageReport({ stone: '3.blueprint', status: 'passed' }),
        new PassageReport({
          stone: '3.blueprint',
          status: 'conceded',
          fulcrum: `.fulcrums/${FULCRUM_F44}`,
        }),
        new PassageReport({ stone: '3.blueprint', status: 'disputed' }),
      ],
    },
    expect: { output: [] },
  },
];

describe('asFulcrumRaisedOnStones', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect([...asFulcrumRaisedOnStones(thisCase.given)]).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
