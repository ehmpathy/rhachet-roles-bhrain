import { getAllPartitionFlagsOfReviewer } from './getAllPartitionFlagsOfReviewer';
import { getAllPartitionFlagsOfScope } from './getAllPartitionFlagsOfScope';
import type { RouteGuardPartitions } from './getOneRouteGuardPartitions';

const ALL = ['review={src/review/**}', 'route={src/route/**}'];
const OVERRIDE = ['solo={src/**}'];
const BOTH: RouteGuardPartitions = {
  all: ALL,
  byPeer: { '3.blueprint/r2': OVERRIDE },
};
const OVERRIDE_ONLY: RouteGuardPartitions = {
  all: null,
  byPeer: { '3.blueprint/r2': OVERRIDE },
};
const NONE: RouteGuardPartitions = { all: null, byPeer: {} };

const REVIEWER_CASES = [
  {
    description: 'a reviewer with an override reads the override, whole',
    given: { declared: BOTH, stone: '3.blueprint', peer: 'r2' },
    expect: OVERRIDE,
  },
  {
    description: 'a reviewer with no override reads @all',
    given: { declared: BOTH, stone: '3.blueprint', peer: 'r1' },
    expect: ALL,
  },
  {
    description: 'the same slug on another stone does not read the override',
    given: { declared: BOTH, stone: '1.vision', peer: 'r2' },
    expect: ALL,
  },
  {
    description: 'a reviewer with neither reads none',
    given: { declared: OVERRIDE_ONLY, stone: '1.vision', peer: 'r1' },
    expect: [],
  },
  {
    description: 'an empty declaration reads none',
    given: { declared: NONE, stone: '1.vision', peer: 'r1' },
    expect: [],
  },
];

const SCOPE_CASES = [
  {
    description: '@all holds the standard set',
    given: { declared: BOTH, scope: { kind: 'all' as const } },
    expect: ALL,
  },
  {
    description: '@all holds null where none was declared',
    given: { declared: OVERRIDE_ONLY, scope: { kind: 'all' as const } },
    expect: null,
  },
  {
    description: 'an override scope holds its own set',
    given: {
      declared: BOTH,
      scope: { kind: 'peer' as const, stone: '3.blueprint', peer: 'r2' },
    },
    expect: OVERRIDE,
  },
  {
    description:
      'an override scope with no set holds null, never a fallback to @all',
    given: {
      declared: BOTH,
      scope: { kind: 'peer' as const, stone: '3.blueprint', peer: 'r1' },
    },
    expect: null,
  },
];

describe('getAllPartitionFlagsOfReviewer', () => {
  REVIEWER_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getAllPartitionFlagsOfReviewer(thisCase.given)).toEqual(
        thisCase.expect,
      );
    }),
  );
});

describe('getAllPartitionFlagsOfScope', () => {
  SCOPE_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getAllPartitionFlagsOfScope(thisCase.given)).toEqual(
        thisCase.expect,
      );
    }),
  );
});
