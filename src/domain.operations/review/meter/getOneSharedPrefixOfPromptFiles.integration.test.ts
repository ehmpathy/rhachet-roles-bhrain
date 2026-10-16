import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { getOneSharedPrefixOfPromptFiles } from './getOneSharedPrefixOfPromptFiles';

/**
 * .what = writes two prompts into a temp dir and answers their paths
 * .why = every case below measures a pair of files on disk
 */
const genPromptPair = (input: {
  slug: string;
  earlier: string;
  later: string;
}): { earlier: string; later: string } => {
  const dir = genTempDir({ slug: input.slug });
  const earlier = path.join(dir, 'earlier.md');
  const later = path.join(dir, 'later.md');
  fs.writeFileSync(earlier, input.earlier);
  fs.writeFileSync(later, input.later);
  return { earlier, later };
};

describe('getOneSharedPrefixOfPromptFiles', () => {
  given('[case1] two prompts that part inside their first chunk', () => {
    const scene = useBeforeAll(async () =>
      genPromptPair({
        slug: 'prefix-files-early',
        earlier: '# rules\nthe rubric\n# targets\nfile a',
        later: '# rules\nthe rubric\n# targets\nfile b, longer',
      }),
    );

    when('[t0] the pair is measured', () => {
      then('the prefix ends at the first divergent byte', async () => {
        const shared = await getOneSharedPrefixOfPromptFiles(scene);
        expect(shared).toEqual({ bytes: 34, chars: 34, laterBytes: 43 });
      });
    });
  });

  given('[case2] two prompts that share more than one chunk', () => {
    const scene = useBeforeAll(async () => {
      // 200k chars of a shared head, so the prefix spans four 64k chunks
      const head = 'a stable rubric line — with a glyph\n'.repeat(5_600);
      return {
        head,
        ...genPromptPair({
          slug: 'prefix-files-chunks',
          earlier: `${head}round one`,
          later: `${head}round two`,
        }),
      };
    });

    when('[t0] the pair is measured', () => {
      then(
        'the prefix spans every whole chunk, in bytes and in chars',
        async () => {
          const shared = await getOneSharedPrefixOfPromptFiles(scene);
          const sharedText = `${scene.head}round `;
          expect(shared?.bytes).toEqual(Buffer.byteLength(sharedText, 'utf-8'));
          expect(shared?.chars).toEqual(sharedText.length);
        },
      );
    });
  });

  given('[case3] two prompts with byte-identical bodies', () => {
    const scene = useBeforeAll(async () =>
      genPromptPair({
        slug: 'prefix-files-whole',
        earlier: 'the same prompt',
        later: 'the same prompt',
      }),
    );

    when('[t0] the pair is measured', () => {
      then('the prefix is the whole later prompt', async () => {
        const shared = await getOneSharedPrefixOfPromptFiles(scene);
        expect(shared?.bytes).toEqual(shared?.laterBytes);
      });
    });
  });

  given('[case4] a pair where one prompt is not on disk', () => {
    const scene = useBeforeAll(async () => {
      const pair = genPromptPair({
        slug: 'prefix-files-absent',
        earlier: 'a prompt',
        later: 'a prompt',
      });
      fs.rmSync(pair.earlier);
      return pair;
    });

    when('[t0] the pair is measured', () => {
      then('it answers null — never a measured zero', async () => {
        expect(await getOneSharedPrefixOfPromptFiles(scene)).toEqual(null);
      });
    });
  });
});
