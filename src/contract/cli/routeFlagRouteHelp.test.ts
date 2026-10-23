import { given, then, useThen, when } from 'test-fns';

import {
  routeBindSet,
  routeStoneAdd,
  routeStoneDel,
  routeStoneGet,
  routeStoneJudge,
  routeStoneSet,
} from './route';

/**
 * .what = pins how each route subcommand's `--help` describes its `--route` flag
 * .why = every `route.stone.*` subcommand falls back to the branch bind when `--route` is
 *        absent (`getRouteOrThrow`), so a help line that calls the flag "(required)" contradicts
 *        the product a driver just used without it. `route.bind.set` is the one honest
 *        "(required)": the route it is about to bind cannot be read from a bind
 *
 * .note = `--help` short-circuits before any i/o in each entrypoint, so this stays a unit test
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

/**
 * .what = the `--route` line of one subcommand's help
 * .why = each case asserts on that one line, not the whole help body
 */
const getRouteFlagLineOfHelp = async (input: {
  skill: string;
  run: () => Promise<void>;
}): Promise<string> => {
  const argvOriginal = process.argv;
  process.argv = ['node', 'rhx', input.skill, '--help'];
  const output = await captureOutput(input.run).finally(() => {
    process.argv = argvOriginal;
  });
  return (
    output.split('\n').find((line) => line.includes('--route <path>')) ?? ''
  );
};

const SUBCOMMANDS_THAT_READ_THE_BIND = [
  { skill: 'route.stone.get', run: routeStoneGet },
  { skill: 'route.stone.set', run: routeStoneSet },
  { skill: 'route.stone.del', run: routeStoneDel },
  { skill: 'route.stone.add', run: routeStoneAdd },
  { skill: 'route.stone.judge', run: routeStoneJudge },
];

describe('route --help, the --route flag', () => {
  given('[case1] a subcommand that falls back to the branch bind', () => {
    SUBCOMMANDS_THAT_READ_THE_BIND.map((subcommand) =>
      when(`[t0] ${subcommand.skill} --help is printed`, () => {
        const result = useThen('it prints without a throw', async () => ({
          line: await getRouteFlagLineOfHelp(subcommand),
        }));

        then('the --route line names the bind fallback', () => {
          expect(result.line).toContain('(uses bound route if absent)');
        });

        then('the --route line does not claim the flag is required', () => {
          expect(result.line).not.toContain('required');
        });
      }),
    );
  });

  given('[case2] route.bind.set, which binds the route it is given', () => {
    when('[t0] route.bind.set --help is printed', () => {
      const result = useThen('it prints without a throw', async () => ({
        line: await getRouteFlagLineOfHelp({
          skill: 'route.bind.set',
          run: routeBindSet,
        }),
      }));

      then('the --route line stays required', () => {
        expect(result.line).toContain('(required)');
      });
    });
  });
});
