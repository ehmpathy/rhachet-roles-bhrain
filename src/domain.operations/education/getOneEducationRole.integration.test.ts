import * as fs from 'fs/promises';
import { ConstraintError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { asEducationRefusalLines } from '@src/contract/cli/asEducationRefusalLines';

import { getOneEducationRole } from './getOneEducationRole';

/**
 * .what = lay out a repo that publishes `mechanic`, links `architect` from a package,
 *         links its own `mechanic` build back, and holds a native `debunker`
 */
const genRepoOfRoles = async (input: { repoRoot: string }): Promise<void> => {
  await fs.writeFile(
    path.join(input.repoRoot, 'rhachet.repo.yml'),
    [
      'slug: ehmpathy',
      'roles:',
      '  - slug: mechanic',
      '    briefs:',
      '      dirs: dist/domain.roles/mechanic/briefs',
      '    skills:',
      '      dirs: dist/domain.roles/mechanic/skills',
      '    boot: dist/domain.roles/mechanic/boot.yml',
    ].join('\n'),
  );
  for (const dir of [
    '.agent/repo=ehmpathy/role=mechanic',
    '.agent/repo=bhuild/role=architect',
    '.agent/repo=.this/role=debunker',
  ])
    await fs.mkdir(path.join(input.repoRoot, dir), { recursive: true });
};

describe('getOneEducationRole.integration', () => {
  given('[case1] a repo with own, linked, and native roles', () => {
    const repoRoot = genTempDir({ slug: 'test-getOneEducationRole' });
    beforeAll(async () => genRepoOfRoles({ repoRoot }));

    when('[t0] the own role is looked up', () => {
      then('it lands in the role source, never its build output', () => {
        expect(getOneEducationRole({ repoRoot, slug: 'mechanic' })).toEqual({
          slug: 'mechanic',
          kind: 'own',
          repo: 'ehmpathy',
          briefsDir: 'src/domain.roles/mechanic/briefs',
          skillsDir: 'src/domain.roles/mechanic/skills',
          bootPath: 'src/domain.roles/mechanic/boot.yml',
        });
      });
    });

    when('[t1] a linked role is looked up', () => {
      then('it lands in a mod', () => {
        expect(getOneEducationRole({ repoRoot, slug: 'architect' })).toEqual({
          slug: 'architect',
          kind: 'linked',
          repo: 'bhuild',
          briefsDir: '.agent/repo=.mods/role=architect/briefs',
          skillsDir: '.agent/repo=.mods/role=architect/skills',
          bootPath: '.agent/repo=.mods/role=architect/boot.yml',
        });
      });
    });

    when('[t2] a native role is looked up', () => {
      then('it lands in place', () => {
        expect(
          getOneEducationRole({ repoRoot, slug: 'debunker' }),
        ).toMatchObject({
          kind: 'native',
          briefsDir: '.agent/repo=.this/role=debunker/briefs',
        });
      });
    });

    when('[t3] an unknown role is looked up', () => {
      then('it refuses, with every role found', async () => {
        const error = await getError(async () =>
          getOneEducationRole({ repoRoot, slug: 'mechanik' }),
        );
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('no role mechanik in this repo');
        expect(error.message).toContain('mechanic (own)');
        expect(error.message).toContain('architect (linked, bhuild)');
        expect(error.message).toContain('debunker (native)');
      });
    });
  });

  given('[case3] an own role whose skills dirs are declared empty', () => {
    const repoRoot = genTempDir({ slug: 'test-getOneEducationRole-empty' });
    beforeAll(async () =>
      fs.writeFile(
        path.join(repoRoot, 'rhachet.repo.yml'),
        [
          'slug: ehmpathy',
          'roles:',
          '  - slug: navigator',
          '    briefs:',
          '      dirs: dist/domain.roles/navigator/briefs',
          '    skills:',
          '      dirs: []',
          '    boot: dist/domain.roles/navigator/boot.yml',
        ].join('\n'),
      ),
    );

    when('[t0] the role is looked up', () => {
      then(
        'it refuses, names the empty key, and says an empty list holds no dir',
        async () => {
          const error = await getError(async () =>
            getOneEducationRole({ repoRoot, slug: 'navigator' }),
          );
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain(
            'lacks a briefs dir, a skills dir, or a boot spec',
          );
          expect(error.message).toContain(
            "declare skills.dirs on the role's definition, then rebuild",
          );
          expect(error.message).toContain('an empty list (`[]`) holds no dir');

          // pin the refusal as the caller reads it, never the raw message with its json metadata
          if (!(error instanceof ConstraintError)) throw error;
          expect(
            asEducationRefusalLines({ error }).join('\n'),
          ).toMatchSnapshot();
        },
      );
    });
  });

  given('[case2] a repo whose rhachet.repo.yml has no roles list', () => {
    const repoRoot = genTempDir({ slug: 'test-getOneEducationRole-malformed' });
    beforeAll(async () =>
      fs.writeFile(
        path.join(repoRoot, 'rhachet.repo.yml'),
        ['slug: ehmpathy', 'roles: mechanic'].join('\n'),
      ),
    );

    when('[t0] a role is looked up', () => {
      then(
        'it refuses, and names the file and its expected shape',
        async () => {
          const error = await getError(async () =>
            getOneEducationRole({ repoRoot, slug: 'mechanic' }),
          );
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain(
            'rhachet.repo.yml has no shape to read roles from',
          );
          expect(error.message).toContain('roles must be a list');
        },
      );
    });
  });
});
