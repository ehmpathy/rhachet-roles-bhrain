import { given, then, when } from 'test-fns';

import { getGuardProvenance } from './getGuardProvenance';

describe('getGuardProvenance', () => {
  given('[case1] content with a provenance.uri as the first key', () => {
    const content = `provenance:
  uri: node_modules/pkg/dist/x/5.1.execution.guard
artifacts:
  - $route/5.1.execution*.md
`;
    when('[t0] scanned', () => {
      then('returns the uri', () => {
        expect(getGuardProvenance({ content })).toEqual({
          uri: 'node_modules/pkg/dist/x/5.1.execution.guard',
        });
      });
    });
  });

  given(
    '[case2] content with provenance AFTER artifacts (position-independent)',
    () => {
      const content = `artifacts:
  - $route/5.1.execution*.md
provenance:
  uri: templates/5.1.execution.guard
judges:
  - rhx judge --mechanism reviewed?
`;
      when('[t0] scanned', () => {
        then('still finds the uri regardless of position', () => {
          expect(getGuardProvenance({ content })).toEqual({
            uri: 'templates/5.1.execution.guard',
          });
        });
      });
    },
  );

  given('[case3] content with a quoted uri', () => {
    const content = `provenance:
  uri: "templates/5.1.execution.guard"
`;
    when('[t0] scanned', () => {
      then('strips the outer quotes', () => {
        expect(getGuardProvenance({ content })).toEqual({
          uri: 'templates/5.1.execution.guard',
        });
      });
    });
  });

  given('[case4] content with NO provenance key', () => {
    const content = `artifacts:
  - $route/1.vision*.md
judges:
  - rhx judge --mechanism reviewed?
`;
    when('[t0] scanned', () => {
      then('returns null', () => {
        expect(getGuardProvenance({ content })).toBeNull();
      });
    });
  });

  given('[case5] a provenance key with NO uri child (malformed)', () => {
    const content = `provenance:
  note: someone forgot the uri
artifacts:
  - $route/1.vision*.md
`;
    when('[t0] scanned', () => {
      then('returns null (malformed → skipped)', () => {
        expect(getGuardProvenance({ content })).toBeNull();
      });
    });
  });

  given('[case6] a provenance key with an EMPTY uri (malformed)', () => {
    const content = `provenance:
  uri:
artifacts:
  - $route/1.vision*.md
`;
    when('[t0] scanned', () => {
      then('returns null (empty uri → skipped)', () => {
        expect(getGuardProvenance({ content })).toBeNull();
      });
    });
  });

  given('[case7] provenance as the LAST key with a comment inside', () => {
    const content = `artifacts:
  - $route/1.vision*.md
provenance:
  # source template for upgrades
  uri: templates/1.vision.guard
`;
    when('[t0] scanned', () => {
      then('skips the comment and finds the uri', () => {
        expect(getGuardProvenance({ content })).toEqual({
          uri: 'templates/1.vision.guard',
        });
      });
    });
  });
});
