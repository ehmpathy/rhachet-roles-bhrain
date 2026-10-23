import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';
import { getOneTargetSplitOfRun } from '@src/domain.operations/review/meter/getOneTargetSplitOfRun';
import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';

describe('getOneTargetSplitOfRun', () => {
  given('[case1] a run whose scope artifact is torn', () => {
    when('[t0] the split is read', () => {
      then(
        'it throws ReviewRunArtifactError, which names the file',
        async () => {
          const dir = genTempDir({ slug: 'split-torn' });
          await fs.writeFile(
            asRunArtifactPath({ dir, artifact: 'scope' }),
            '{ "targetFiles": [',
            'utf-8',
          );
          const error = await getError(
            getOneTargetSplitOfRun({ at: dir, cwd: dir }),
          );
          expect(error).toBeInstanceOf(ReviewRunArtifactError);
          expect(error.message).toContain(
            path.basename(asRunArtifactPath({ dir, artifact: 'scope' })),
          );
        },
      );
    });
  });

  // a parse fault other than a torn body surfaces as itself — proven with real error
  // instances in asRunArtifactParseFault.test.ts, never by a mock of the parser here
});
