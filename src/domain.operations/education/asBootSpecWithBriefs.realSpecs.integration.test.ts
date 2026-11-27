import { existsSync, readdirSync, readFileSync } from 'fs';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { asBootClaim } from './asBootClaim';
import { asBootSpecNames } from './asBootSpecNames';
import { asBootSpecWithBriefs } from './asBootSpecWithBriefs';

/**
 * .what = every boot spec this repo's roles ship
 */
const ROLES_DIR = path.join(__dirname, '..', '..', 'domain.roles');
const BOOT_SPECS = readdirSync(ROLES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(ROLES_DIR, entry.name, 'boot.yml'))
  .filter((at) => existsSync(at));

const SAY = 'briefs/education/pedigree._.md';
const REF = 'briefs/education/pedigree.pursuit=v2026_11_26.slug.md';

/**
 * .what = the splice, run over every real boot spec this repo ships
 * .why = a synthetic spec covers the shapes the author thought of; a real one holds the shapes
 *        a role grew (an empty flow map, a budget, a comment, a nested `always:`)
 */
describe('asBootSpecWithBriefs, over the real boot specs', () => {
  given('[case1] each role this repo ships, educated once', () => {
    when(
      '[t0] the pedigree index and an entry are spliced into its boot spec',
      () => {
        then('each spec takes the splice, and boots each path as asked', () => {
          expect(BOOT_SPECS.length).toBeGreaterThanOrEqual(11);
          for (const at of BOOT_SPECS) {
            const spec = asBootSpecWithBriefs({
              spec: readFileSync(at, 'utf-8'),
              say: [SAY],
              ref: [REF],
              isRoleSpec: true,
              modeOfRole: null,
              at,
            });
            const names = asBootSpecNames({ spec, at });
            const claimOf = (p: string) =>
              asBootClaim({
                curation: names.briefs,
                mode: names.mode,
                isRoleSpec: true,
                path: p,
              });
            expect({ at, say: claimOf(SAY), ref: claimOf(REF) }).toEqual({
              at,
              say: 'say',
              ref: 'ref',
            });
          }
        });
      },
    );
  });
});
