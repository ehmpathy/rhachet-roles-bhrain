import { given, then, useThen, when } from 'test-fns';

import { routeStoneSet } from './route';

/**
 * .what = pins `route.stone.set --help` as a driver reads it
 * .why = the help lists every `--as` status and the flags each one needs (`--that`, `--with`,
 *        `--about`, `--why`, `--what`). a reword, a dropped status, or a lost flag line would
 *        ship green with no diff for a reviewer to see; `rule.require.contract-snapshot-exhaustiveness`
 *        names `--help` as a cli variant that owes coverage, and `route.drive --help` already
 *        carries its own (`routeDriveHelp.test.ts`)
 *
 * .note = `--help` short-circuits before any i/o (`routeStoneSet`), so this stays a unit
 *         test — no filesystem, no route, no boundary crossed (`rule.forbid.unit.remote-boundaries`)
 */
const captureOutput = async (fn: () => Promise<void>): Promise<string> => {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]): number => logs.push(args.join(' '));
  try {
    await fn();
  } finally {
    console.log = originalLog;
  }
  return logs.join('\n');
};

describe('route.stone.set --help', () => {
  given('[case1] a driver asks for the help', () => {
    when('[t0] help is printed', () => {
      const result = useThen('it prints without a throw', async () => {
        const argvOriginal = process.argv;
        process.argv = ['node', 'rhx', 'route.stone.set', '--help'];
        const output = await captureOutput(() => routeStoneSet()).finally(
          () => {
            process.argv = argvOriginal;
          },
        );
        return { output };
      });

      then('it names every status the command accepts', () => {
        for (const status of [
          'passed',
          'arrived',
          'approved',
          'promised',
          'absorbed',
          'conceded',
          'disputed',
          'blocked',
          'rewound',
          'overruled',
          'forced',
          'inflight',
        ])
          expect(result.output).toContain(status);
      });

      then('it names the flags a stance and an inflight mark need', () => {
        expect(result.output).toContain('--with <slug>');
        expect(result.output).toContain('--about <concern>');
        expect(result.output).toContain('--why <path>');
        expect(result.output).toContain('--what');
      });

      then('the whole help surface is pinned, as a driver reads it', () => {
        // .why no mask = `--help` short-circuits before any i/o, so the text is static
        expect(result.output).toMatchSnapshot();
      });
    });
  });
});
