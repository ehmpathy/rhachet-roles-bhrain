import { given, then, when } from 'test-fns';

import { asTreeLinesClosed } from './asTreeLinesClosed';

const TEST_CASES = [
  {
    description: 'no tree row leaves the lines as they were',
    given: { lines: ['', 'headline'] },
    expect: { lines: ['', 'headline'] },
  },
  {
    description: 'an open last row flips to a close',
    given: { lines: ['   ├─ a', '   ├─ b'] },
    expect: { lines: ['   ├─ a', '   └─ b'] },
  },
  {
    description: 'the rail beneath the last row is blanked',
    given: { lines: ['   ├─ a', '   ├─ b', '   │  └─ c'] },
    expect: { lines: ['   ├─ a', '   └─ b', '      └─ c'] },
  },
  {
    description: 'a tree already closed stays closed',
    given: { lines: ['   ├─ a', '   └─ b', '      └─ c'] },
    expect: { lines: ['   ├─ a', '   └─ b', '      └─ c'] },
  },
];

describe('asTreeLinesClosed', () => {
  given('[case1] each tree shape', () => {
    when('[t0] the tree is closed', () => {
      TEST_CASES.map((thisCase) =>
        then(thisCase.description, () => {
          const lines = asTreeLinesClosed({ lines: thisCase.given.lines });
          expect(lines).toEqual(thisCase.expect.lines);
        }),
      );
    });
  });
});
