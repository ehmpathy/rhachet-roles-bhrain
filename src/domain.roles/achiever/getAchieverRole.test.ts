import { given, then, when } from 'test-fns';

import { ROLE_ACHIEVER } from './getAchieverRole';

describe('getAchieverRole', () => {
  given('[case1] role definition', () => {
    when('[t0] role is built', () => {
      then('has correct slug', () => {
        expect(ROLE_ACHIEVER.slug).toEqual('achiever');
      });

      then('has correct name', () => {
        expect(ROLE_ACHIEVER.name).toEqual('Achiever');
      });

      then('has purpose defined', () => {
        expect(ROLE_ACHIEVER.purpose).toContain('goal');
      });

      then('has readme configured', () => {
        expect(ROLE_ACHIEVER.readme.uri).toContain('readme.md');
      });

      then('has boot configured', () => {
        expect(ROLE_ACHIEVER.boot?.uri).toContain('boot.yml');
      });

      then('has skills directory configured', () => {
        const dirs = ROLE_ACHIEVER.skills.dirs;
        expect(Array.isArray(dirs)).toBe(true);
        expect((dirs as { uri: string }[])[0]?.uri).toContain('/skills');
      });

      then('has briefs directory configured', () => {
        const dirs = ROLE_ACHIEVER.briefs.dirs;
        expect(Array.isArray(dirs)).toBe(true);
        expect((dirs as { uri: string }[])[0]?.uri).toContain('/briefs');
      });
    });
  });
});
