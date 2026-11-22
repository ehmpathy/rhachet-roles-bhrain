import { given, then, when } from 'test-fns';

import { asWarmerArgsFromArgv } from './asWarmerArgsFromArgv';
import { asWarmerArgv } from './asWarmerArgv';

describe('asWarmerArgv', () => {
  given('[case1] a settled warmer plan', () => {
    const args = {
      reviewer: 'repo-rules',
      logDir: '.log/bhrain/review/2026-10-03T04-00-00-000Z.pid1.abc',
      plan: { pokes: 4, everyMinutes: 15 },
      brain: 'openrouter/deepseek/flash',
    };

    when('[t0] the argv is written then read back', () => {
      // node consumes `-e <entry> --`, so the child's process.argv is the exec path
      // then the flags alone
      const read = asWarmerArgsFromArgv({
        argv: ['/usr/bin/node', ...asWarmerArgv(args)],
      });

      then('every field survives the round trip', () => {
        expect(read).toEqual({
          unknown: [],
          reviewer: args.reviewer,
          logDir: args.logDir,
          pokes: 4,
          every: 15,
          brain: args.brain,
        });
      });
    });
  });

  given('[case2] an argv with a flag the writer never emits', () => {
    when('[t0] the argv is read', () => {
      const read = asWarmerArgsFromArgv({
        argv: ['--reviewer', 'repo-rules', '--cadence', '5'],
      });

      then('the stranger flag is named, never skipped', () => {
        expect(read.unknown).toEqual(['--cadence']);
        expect(read.reviewer).toEqual('repo-rules');
      });
    });
  });

  given('[case3] an argv with a flag absent', () => {
    when('[t0] the argv is read', () => {
      const read = asWarmerArgsFromArgv({
        argv: ['--reviewer', 'repo-rules', '--pokes', '4'],
      });

      then(
        'the absent fields stay undefined, so the contract can name them',
        () => {
          expect(read.brain).toEqual(undefined);
          expect(read.logDir).toEqual(undefined);
          expect(read.every).toEqual(undefined);
          expect(read.pokes).toEqual(4);
        },
      );
    });
  });
});
