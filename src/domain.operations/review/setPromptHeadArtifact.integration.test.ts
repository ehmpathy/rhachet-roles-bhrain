import * as fs from 'fs';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';

import { setPromptHeadArtifact } from './setPromptHeadArtifact';

describe('setPromptHeadArtifact', () => {
  given('[case1] a run log dir and a static prompt head', () => {
    const logDir = genTempDir({ slug: 'prompt-head-artifact' });
    const head =
      '# rules\n\nthe static head every round of this lane shares.\n';

    when('[t0] the head is written', () => {
      const artifact = useThen('it returns the artifact', async () =>
        setPromptHeadArtifact({ logDir, head }),
      );

      then('the file lands at the run path for the head artifact', () => {
        const expected = asRunArtifactPath({ dir: logDir, artifact: 'head' });
        expect(fs.readFileSync(expected, 'utf-8')).toEqual(head);
      });

      then(
        'the returned artifact reads back the same bytes — the brief the brain receives',
        async () => {
          const read = await artifact.get();
          expect(read?.content).toEqual(head);
        },
      );
    });
  });
});
