import { asAllFulcrumsCaseUnique } from './asAllFulcrumsCaseUnique';
import type { FulcrumFrontmatterParse } from './asFulcrumFrontmatter';

const PARSE_ABSENT: FulcrumFrontmatterParse = { kind: 'absent' };

describe('asAllFulcrumsCaseUnique', () => {
  test('entries under distinct case ids pass through untouched', () => {
    const fulcrums = [
      { slug: 'F1', parse: PARSE_ABSENT },
      { slug: 'F2', parse: PARSE_ABSENT },
    ];
    expect(asAllFulcrumsCaseUnique({ fulcrums })).toEqual(fulcrums);
  });

  test('🔴 clamp. two files under one case id are each named unreadable, with the clash', () => {
    // the lever resolves --case by id; a clash it took by order would leave one dispute unruleable
    const result = asAllFulcrumsCaseUnique({
      fulcrums: [
        { slug: 'F44', parse: PARSE_ABSENT },
        {
          slug: 'F44',
          parse: { kind: 'invalid', absent: ['owed'], malformed: [] },
        },
        { slug: 'F45', parse: PARSE_ABSENT },
      ],
    });
    expect(result.map((fulcrum) => fulcrum.parse)).toEqual([
      {
        kind: 'invalid',
        absent: [],
        malformed: ['case (unique on the route; F44 names 2 files)'],
      },
      {
        kind: 'invalid',
        absent: ['owed'],
        malformed: ['case (unique on the route; F44 names 2 files)'],
      },
      PARSE_ABSENT,
    ]);
  });
});
