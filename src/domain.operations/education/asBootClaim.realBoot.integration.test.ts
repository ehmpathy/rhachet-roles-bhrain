import { execFileSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { asBootClaim } from './asBootClaim';
import { asBootSpecNames } from './asBootSpecNames';
import { getOneRhachetBinPath } from './getOneRhachetBinPath';

const ROLE_DIR = '.agent/repo=.this/role=probe';
const BRIEFS_EXTANT = ['briefs/rule.require.a.md', 'briefs/rule.require.b.md'];
const BRIEF_NEW = 'briefs/rule.require.new.md';

/**
 * .what = how a real `rhachet roles boot` claims one brief path: say, ref, or null
 * .note = a ref renders alone (`<brief.ref path=…/>`) or grouped under a base dir
 *         (`<briefs.ref base=…>` with one name per line)
 */
const asClaimOfBootStdout = (input: {
  stdout: string;
  path: string;
}): 'say' | 'ref' | null => {
  const full = `${ROLE_DIR}/${input.path}`;
  if (input.stdout.includes(`<brief.say path="${full}"`)) return 'say';
  if (input.stdout.includes(`<brief.ref path="${full}"`)) return 'ref';
  const groups = [
    ...input.stdout.matchAll(
      /<briefs\.ref base="([^"]*)">\n([^<]*)<\/briefs\.ref>/g,
    ),
  ];
  const grouped = groups.some(([, base, names]) =>
    (names ?? '')
      .split('\n')
      .some((name) => name !== '' && `${base}${name}` === full),
  );
  return grouped ? 'ref' : null;
};

/**
 * .what = a temp repo with a native role of three briefs, booted as rhachet boots it
 */
const genBootOfSpec = (input: { slug: string; spec: string | null }) => {
  const repoRoot = genTempDir({ slug: input.slug });
  mkdirSync(path.join(repoRoot, ROLE_DIR, 'briefs'), { recursive: true });
  for (const p of [...BRIEFS_EXTANT, BRIEF_NEW])
    writeFileSync(path.join(repoRoot, ROLE_DIR, p), `# ${p}\n\nbody\n`);
  if (input.spec !== null)
    writeFileSync(path.join(repoRoot, ROLE_DIR, 'boot.yml'), input.spec);
  const stdout = String(
    execFileSync(
      getOneRhachetBinPath(),
      ['roles', 'boot', '--repo', '.this', '--role', 'probe'],
      { cwd: repoRoot, maxBuffer: 64 * 1024 * 1024 },
    ),
  );
  return { stdout };
};

/**
 * .what = the claim asBootClaim reads, for each brief, from one spec
 */
const asClaimsOfSpec = (input: { spec: string | null }) => {
  const names = asBootSpecNames({ spec: input.spec ?? '', at: 'boot.yml' });
  return Object.fromEntries(
    [...BRIEFS_EXTANT, BRIEF_NEW].map((p) => [
      p,
      asBootClaim({
        curation: names.briefs,
        mode: names.mode,
        isRoleSpec: true,
        path: p,
      }),
    ]),
  );
};

const SPECS: Array<{ slug: string; spec: string | null }> = [
  { slug: 'nospec', spec: null },
  { slug: 'simple-say', spec: `briefs:\n  say:\n    - ${BRIEF_NEW}\n` },
  { slug: 'simple-ref', spec: `briefs:\n  ref:\n    - ${BRIEF_NEW}\n` },
  {
    slug: 'subject-say',
    spec: `always:\n  briefs:\n    say:\n      - ${BRIEF_NEW}\n`,
  },
];

/**
 * .what = asBootClaim, held against a real boot of each spec shape a student might write
 * .why = the proof and the splice trust asBootClaim to say what a boot holds; where it parts
 *        from rhachet, a course can pass while the role's extant briefs drop out of its boot
 */
describe('asBootClaim, against a real rhachet boot', () => {
  for (const shape of SPECS)
    given(`[case:${shape.slug}] a native role booted with this spec`, () => {
      const scene = useBeforeAll(async () =>
        genBootOfSpec({
          slug: `test-bootclaim-${shape.slug}`,
          spec: shape.spec,
        }),
      );
      when('[t0] each brief is read off the boot', () => {
        then('asBootClaim agrees with the boot, for every brief', () => {
          const real = Object.fromEntries(
            [...BRIEFS_EXTANT, BRIEF_NEW].map((p) => [
              p,
              asClaimOfBootStdout({ stdout: scene.stdout, path: p }),
            ]),
          );
          expect(asClaimsOfSpec({ spec: shape.spec })).toEqual(real);
        });
      });
    });
});
