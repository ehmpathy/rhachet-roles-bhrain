import { execFileSync } from 'child_process';
import { given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = clamp: no brief file in this repo carries `[` or `]` in its name
 * .why  = a bracket is a glob metacharacter, so a bracketed brief is unaddressable by a boot.yml
 *         glob, `globsafe`, or `Glob` (rule.forbid.brackets-in-filenames, librarian). the repo's
 *         briefs were renamed to coordinate form once; this keeps a new one from regress
 * .note = a dot dir under briefs/ (`.scratch/`, `.route/`) is out of scope: its brackets are its
 *         own marks, never an archetype, and none of it boots
 */
const getAllBriefFilesBracketed = (): string[] =>
  execFileSync('git', [
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
    '-z',
  ])
    .toString()
    .split('\0')
    .filter(Boolean)
    .filter(
      (rel) => rel.startsWith('src/') || rel.startsWith('.agent/repo=.this/'),
    )
    .filter((rel) => rel.includes('/briefs/'))
    .filter(
      (rel) =>
        !rel
          .slice(rel.indexOf('/briefs/') + '/briefs/'.length)
          .split('/')
          .slice(0, -1)
          .some((segment) => segment.startsWith('.')),
    )
    .filter((rel) => /[[\]]/.test(rel.split('/').pop() ?? ''));

describe('briefFilenames', () => {
  given('[case1] every brief file in this repo', () => {
    when('[t0] the names are read', () => {
      const scene = useBeforeAll(async () => ({
        bracketed: getAllBriefFilesBracketed(),
      }));

      then('none carries a bracket in its name', () => {
        expect(scene.bracketed).toEqual([]);
      });
    });
  });
});
