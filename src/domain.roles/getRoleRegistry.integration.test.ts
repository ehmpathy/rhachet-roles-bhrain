import { ConstraintError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { getRoleRegistry } from '@src/domain.roles/getRoleRegistry';

import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * .what = every role in the registry names a readme that the build ships
 * .why  = the build copies only `**\/readme.md` (plus `briefs/**`) into dist, so a role whose
 *         readme uri names any other file — e.g. a `.readme.[seed].md` — resolves in src and
 *         points at naught in dist. the librarian shipped that way until this clamp. the name
 *         check runs on src; the third assertion binds it to the build's own copy rule, so a
 *         change to that rule fails here too
 */

const REPO_ROOT: string = path.join(__dirname, '..', '..');
const BUILD_COPY_KEY = 'build:complete:dist';

// communicator: the text of one file on disk
const getOneTextOfFile = (input: { file: string }): string =>
  fs.readFileSync(input.file, 'utf8');

// communicator: whether one path names a file on disk
const isFileFound = (input: { file: string }): boolean =>
  fs.existsSync(input.file);

// transformer: the build copy command held in one package.json text
const asBuildCopyCommand = (input: { text: string }): string => {
  const command = JSON.parse(input.text)?.scripts?.[BUILD_COPY_KEY];

  // reject a package.json with no build copy command — there is no rule to bind to
  if (typeof command !== 'string')
    throw new ConstraintError('package.json has no build copy command', {
      key: BUILD_COPY_KEY,
      hint: 'declare that npm command, or point this test at the one that copies src into dist',
    });

  return command;
};

// transformer: the `--include` patterns of one rsync command, quotes stripped
const asIncludesOfCommand = (input: { command: string }): string[] =>
  input.command
    .split(/\s+/)
    .filter((token) => token.startsWith('--include='))
    .map((token) =>
      token.slice('--include='.length).replace(/^['"]|['"]$/g, ''),
    );

// the readme each role declares
const getAllRoleReadmes = (): { slug: string; uri: string }[] =>
  getRoleRegistry().roles.map((role) => ({
    slug: role.slug,
    uri: role.readme.uri,
  }));

// the readmes whose file name the build does not copy
const getAllReadmesMisnamed = (input: {
  readmes: { slug: string; uri: string }[];
}): { slug: string; uri: string }[] =>
  input.readmes.filter((readme) => path.basename(readme.uri) !== 'readme.md');

// the readmes with no file on disk
const getAllReadmesAbsent = (input: {
  readmes: { slug: string; uri: string }[];
}): { slug: string; uri: string }[] =>
  input.readmes.filter((readme) => !isFileFound({ file: readme.uri }));

// the include patterns of the rsync that copies non-ts assets from src into dist
const getAllBuildCopyIncludes = (): string[] =>
  asIncludesOfCommand({
    command: asBuildCopyCommand({
      text: getOneTextOfFile({ file: path.join(REPO_ROOT, 'package.json') }),
    }),
  });

// transformer: whether one rsync command copies the file a symlink names, not the link itself
const isCopyOfLinkTargets = (input: { command: string }): boolean =>
  input.command
    .split(/\s+/)
    .some((token) => token === '--copy-links' || /^-[a-zA-Z]*L/.test(token));

// communicator: every symlink under one role's briefs dir in src
const getAllBriefLinksOfRole = (input: { slug: string }): string[] => {
  const dir = path.join(REPO_ROOT, 'src', 'domain.roles', input.slug, 'briefs');
  if (!isFileFound({ file: dir })) return [];
  return fs
    .readdirSync(dir, { recursive: true })
    .map(String)
    .filter((entry) => fs.lstatSync(path.join(dir, entry)).isSymbolicLink());
};

describe('getRoleRegistry', () => {
  given('[case1] the bhrain role registry', () => {
    const readmes = getAllRoleReadmes();

    when('[t0] each role readme uri is read', () => {
      then('every readme uri is named readme.md', () => {
        expect(readmes.length).toBeGreaterThan(0);
        expect(getAllReadmesMisnamed({ readmes })).toEqual([]);
      });

      then('every readme uri exists on disk', () => {
        expect(getAllReadmesAbsent({ readmes })).toEqual([]);
      });
    });

    when('[t1] the build copy rule is read', () => {
      then('it ships every `readme.md` and every brief into dist', () => {
        const includes = getAllBuildCopyIncludes();
        expect(includes).toContain('**/readme.md');
        expect(includes).toContain('briefs/**');
      });

      then(
        'it ships a symlinked brief as the file it names, never as a link',
        () => {
          // a role borrows a brief via a symlink in src; npm omits a symlink from the tarball,
          // so a build that copies the link itself ships a role with that brief absent
          const links = getRoleRegistry().roles.flatMap((role) =>
            getAllBriefLinksOfRole({ slug: role.slug }),
          );
          expect(links.length).toBeGreaterThan(0);
          expect(
            isCopyOfLinkTargets({
              command: asBuildCopyCommand({
                text: getOneTextOfFile({
                  file: path.join(REPO_ROOT, 'package.json'),
                }),
              }),
            }),
          ).toEqual(true);
        },
      );
    });
  });
});
