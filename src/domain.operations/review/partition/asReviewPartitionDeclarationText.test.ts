import { given, then, when } from 'test-fns';

import { asReviewPartitionDeclarationText } from './asReviewPartitionDeclarationText';

const COMMAND = {
  head: 'rhx route.guard.partition --for review --peer @all',
  tail: '  --mode apply',
};

describe('asReviewPartitionDeclarationText', () => {
  given('[case1] a set held from an older brace-form declaration', () => {
    when('[t0] the whole set is rendered', () => {
      const text = asReviewPartitionDeclarationText({
        partition: [
          'route={src/route/**,.behavior/v1/**}',
          'review=src/review/**,.behavior/v1/**',
        ],
        command: COMMAND,
      });

      then('🔴 a held brace set prints as a bare comma list', () => {
        expect(text).toContain(
          "--partition 'route=src/route/**,.behavior/v1/**'",
        );
        expect(text).not.toMatch(/[{}]/);
      });

      then('a comma value prints as given', () => {
        expect(text).toContain(
          "--partition 'review=src/review/**,.behavior/v1/**'",
        );
      });

      then('the text matches the snapshot', () => {
        expect(text).toContain(
          "  --partition 'review=src/review/**,.behavior/v1/**' \\\n  --mode apply",
        );
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case2] a glob that carries a brace set of its own', () => {
    when('[t0] it is rendered', () => {
      const text = asReviewPartitionDeclarationText({
        partition: ['route=src/route/{stones,judges}/**,.behavior/v1/**'],
        command: COMMAND,
      });

      then('the inner brace set is the glob own, and kept whole', () => {
        expect(text).toContain(
          "--partition 'route=src/route/{stones,judges}/**,.behavior/v1/**'",
        );
      });

      then('the text matches the snapshot', () => {
        expect(text).toContain(
          "rhx route.guard.partition --for review --peer @all \\\n  --partition 'route=src/route/{stones,judges}/**,.behavior/v1/**' \\",
        );
        expect(text).toMatchSnapshot();
      });
    });
  });
});
