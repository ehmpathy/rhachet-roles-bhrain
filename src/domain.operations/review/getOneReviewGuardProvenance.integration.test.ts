import * as fs from 'fs';
import { MalfunctionError } from 'helpful-errors';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  when,
} from 'test-fns';

import { getOneReviewGuardProvenance } from './getOneReviewGuardProvenance';

const ROUTE = '.behavior/v2026_10_04.feat';
const OUTPUT = `${ROUTE}/.reviews/peer/5.3.verification._.review.i003.ee09cef13102f22c3a.r001._.given.by_peer.repo-rules.report.md`;

/**
 * .what = writes a file, and makes its parent dirs first
 * .why = keeps each scene to the files it is about
 */
const writeDeep = (input: { cwd: string; file: string; content: string }) => {
  const full = path.join(input.cwd, input.file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, input.content);
};

describe('getOneReviewGuardProvenance', () => {
  given(
    '[case1] a lane whose guard was stamped from a dependency template',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'guard-provenance-dep' });
        writeDeep({
          cwd,
          file: `${ROUTE}/5.3.verification.guard`,
          content: [
            '# provenance = source template',
            'provenance:',
            '  uri: node_modules/rhachet-roles-bhuild/dist/templates/5.3.verification.guard',
            '',
            'reviews:',
            '  peer: []',
          ].join('\n'),
        });
        writeDeep({
          cwd,
          file: 'node_modules/rhachet-roles-bhuild/package.json',
          content: JSON.stringify({
            name: 'rhachet-roles-bhuild',
            repository: {
              url: 'git+https://github.com/ehmpathy/rhachet-roles-bhuild.git',
            },
          }),
        });
        return {
          provenance: await getOneReviewGuardProvenance({
            output: OUTPUT,
            cwd,
          }),
        };
      });

      when('[t0] the provenance is read from the output path', () => {
        then(
          'it names the guard, its template, and the repo that owns it',
          () => {
            expect(scene.provenance).toEqual({
              slug: 'repo-rules',
              guard: `${ROUTE}/5.3.verification.guard`,
              uri: 'node_modules/rhachet-roles-bhuild/dist/templates/5.3.verification.guard',
              repo: 'ehmpathy/rhachet-roles-bhuild',
            });
          },
        );
      });
    },
  );

  given(
    '[case2] a template whose package declares a bare owner/name repo',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'guard-provenance-bare' });
        writeDeep({
          cwd,
          file: `${ROUTE}/5.3.verification.guard`,
          content: 'provenance:\n  uri: node_modules/@ehmpathy/roles/t.guard\n',
        });
        writeDeep({
          cwd,
          file: 'node_modules/@ehmpathy/roles/package.json',
          content: JSON.stringify({ repository: 'ehmpathy/roles' }),
        });
        return {
          provenance: await getOneReviewGuardProvenance({
            output: OUTPUT,
            cwd,
          }),
        };
      });

      when('[t0] the provenance is read', () => {
        then('a scoped package is read, and its bare repo field taken', () => {
          expect(scene.provenance?.repo).toEqual('ehmpathy/roles');
        });
      });
    },
  );

  given('[case3] a route-local guard, with no provenance block', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'guard-provenance-local' });
      writeDeep({
        cwd,
        file: `${ROUTE}/5.3.verification.guard`,
        content: 'reviews:\n  peer: []\n',
      });
      return {
        provenance: await getOneReviewGuardProvenance({ output: OUTPUT, cwd }),
      };
    });

    when('[t0] the provenance is read', () => {
      then('there is no upstream — null', () => {
        expect(scene.provenance).toEqual(null);
      });
    });
  });

  given('[case4] a hand review, written outside any route', () => {
    when('[t0] the provenance is read', () => {
      then('no guard ran it — null', async () => {
        expect(
          await getOneReviewGuardProvenance({
            output: '.review/main/2026-10-04.output.md',
            cwd: genTempDir({ slug: 'guard-provenance-hand' }),
          }),
        ).toEqual(null);
      });
    });
  });

  /**
   * .what = writes a guard stamped from a dependency, plus that dependency's manifest
   * .why = the two parse-fault cases below differ only in the manifest bytes
   */
  const genSceneOfManifest = (input: { slug: string; manifest: string }) => {
    const cwd = genTempDir({ slug: input.slug });
    writeDeep({
      cwd,
      file: `${ROUTE}/5.3.verification.guard`,
      content: 'provenance:\n  uri: node_modules/torn-dep/t.guard\n',
    });
    writeDeep({
      cwd,
      file: 'node_modules/torn-dep/package.json',
      content: input.manifest,
    });
    return { cwd };
  };

  given('[case5] a dependency manifest that is torn json', () => {
    when('[t0] the provenance is read', () => {
      then('it fails loud as a malfunction that names the file', async () => {
        const { cwd } = genSceneOfManifest({
          slug: 'guard-provenance-torn',
          manifest: '{ "repository": ',
        });
        const error = await getError(
          getOneReviewGuardProvenance({ output: OUTPUT, cwd }),
        );
        expect(error).toBeInstanceOf(MalfunctionError);
        expect(error.message).toContain('node_modules/torn-dep/package.json');
      });
    });
  });

  // .note = a parse fault of any other class (a RangeError from the engine) surfaces as
  //         itself. that allowlist is pure, so `asDependencyManifestParseFault.test.ts`
  //         proves it with real error instances, never a mock of the parser here
});
