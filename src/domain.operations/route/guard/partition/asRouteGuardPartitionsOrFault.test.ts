import { asRouteGuardPartitionsOrFault } from './asRouteGuardPartitionsOrFault';
import type { RouteGuardPartitions } from './getOneRouteGuardPartitions';

const TEST_CASES: {
  description: string;
  given: { content: string };
  expect: {
    declared: RouteGuardPartitions | null;
    faultContains: string | null;
  };
}[] = [
  {
    description: 'reads a declaration with an @all set and an override',
    given: {
      content: JSON.stringify({
        all: ['a=src/a/**'],
        byPeer: { '3.blueprint/r2': ['b=src/b/**'] },
      }),
    },
    expect: {
      declared: {
        all: ['a=src/a/**'],
        byPeer: { '3.blueprint/r2': ['b=src/b/**'] },
      },
      faultContains: null,
    },
  },
  {
    description: 'reads a declaration with no @all set',
    given: { content: JSON.stringify({ all: null, byPeer: {} }) },
    expect: { declared: { all: null, byPeer: {} }, faultContains: null },
  },
  {
    description: 'refuses content that is not json, and names the parser cause',
    given: { content: '{ all: [' },
    expect: { declared: null, faultContains: 'not json — ' },
  },
  {
    description: 'refuses json that is not an object',
    given: { content: '["a=src/**"]' },
    expect: { declared: null, faultContains: 'not the shape the tool writes' },
  },
  {
    description: 'refuses an @all set that holds a non-string',
    given: { content: JSON.stringify({ all: [1], byPeer: {} }) },
    expect: { declared: null, faultContains: 'not the shape the tool writes' },
  },
  {
    description: 'refuses a declaration with no byPeer record',
    given: { content: JSON.stringify({ all: null }) },
    expect: { declared: null, faultContains: 'not the shape the tool writes' },
  },
  {
    description: 'refuses a byPeer that is a list, not a record',
    given: { content: JSON.stringify({ all: null, byPeer: [] }) },
    expect: { declared: null, faultContains: 'not the shape the tool writes' },
  },
  {
    description: 'refuses an override that holds a non-string',
    given: {
      content: JSON.stringify({ all: null, byPeer: { 's/p': [true] } }),
    },
    expect: { declared: null, faultContains: 'not the shape the tool writes' },
  },
];

describe('asRouteGuardPartitionsOrFault', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const read = asRouteGuardPartitionsOrFault(thisCase.given);
      expect(read.declared).toEqual(thisCase.expect.declared);
      if (thisCase.expect.faultContains === null)
        return expect(read.fault).toBeNull();
      expect(read.fault).toContain(thisCase.expect.faultContains);

      // the whole fault a driver reads, pinned per variant: a bare `toContain` passes on a
      // reword that keeps the fragment and wrecks the shape around it
      expect(read.fault).toMatchSnapshot();
    }),
  );
});
