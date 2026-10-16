import * as fs from 'fs/promises';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';
import { getOneRunArtifactJson } from '@src/domain.operations/review/meter/getOneRunArtifactJson';
import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';

describe('getOneRunArtifactJson', () => {
  given('[case1] a run that never wrote the artifact', () => {
    when('[t0] the artifact is read', () => {
      then('it answers null', async () => {
        const dir = genTempDir({ slug: 'artifact-json-absent' });
        const body = await getOneRunArtifactJson({ dir, artifact: 'scope' });
        expect(body).toBeNull();
      });
    });
  });

  given('[case2] a run whose artifact is well formed', () => {
    when('[t0] the artifact is read', () => {
      then('it answers the parsed body', async () => {
        const dir = genTempDir({ slug: 'artifact-json-present' });
        await fs.writeFile(
          asRunArtifactPath({ dir, artifact: 'scope' }),
          JSON.stringify({ targetFiles: ['src/a.ts'] }),
          'utf-8',
        );
        const body = await getOneRunArtifactJson({ dir, artifact: 'scope' });
        expect(body).toEqual({ targetFiles: ['src/a.ts'] });
      });
    });
  });

  given('[case3] a run whose artifact is torn', () => {
    when('[t0] the artifact is read', () => {
      then(
        'it throws ReviewRunArtifactError, which names the file and its dir',
        async () => {
          const dir = genTempDir({ slug: 'artifact-json-torn' });
          await fs.writeFile(
            asRunArtifactPath({ dir, artifact: 'realized' }),
            '{ "cost": ',
            'utf-8',
          );
          const error = await getError(
            getOneRunArtifactJson({ dir, artifact: 'realized' }),
          );
          expect(error).toBeInstanceOf(ReviewRunArtifactError);
          expect(error.message).toContain(
            'review log artifact is present but unparseable: metrics.realized.json',
          );
          expect(error.message).toContain(dir);
        },
      );
    });
  });

  given('[case5] 🔴 a run whose artifact parses but holds no record', () => {
    const bodies = ['5', '[]', '"x"', 'null'];
    bodies.map((raw) =>
      when(`[t0] the artifact body is ${raw}`, () => {
        then(
          'it throws ReviewRunArtifactError, never a record with no fields',
          async () => {
            const dir = genTempDir({ slug: 'artifact-json-norecord' });
            await fs.writeFile(
              asRunArtifactPath({ dir, artifact: 'args' }),
              raw,
              'utf-8',
            );
            const error = await getError(
              getOneRunArtifactJson({ dir, artifact: 'args' }),
            );
            expect(error).toBeInstanceOf(ReviewRunArtifactError);
            expect(error.message).toContain(
              'review log artifact is present but holds no record: input.args.json',
            );
          },
        );
      }),
    );
  });

  // a parse fault other than a torn body surfaces as itself — proven with real error
  // instances in asRunArtifactParseFault.test.ts, never by a mock of the parser here
});
