import { getError, given, then, when } from 'test-fns';

import { withStdoutToStderr } from './withStdoutToStderr';

describe('withStdoutToStderr', () => {
  given('[case1] an operation that prints to stdout', () => {
    when('[t0] it runs inside the reroute', () => {
      then(
        'its console.log lands on stderr, and stdout sees none of it',
        async () => {
          const errorOriginal = console.error;
          const errSeen: unknown[][] = [];
          console.error = (...args: unknown[]) => void errSeen.push(args);
          const logOriginal = console.log;
          const logSeen: unknown[][] = [];
          console.log = (...args: unknown[]) => logSeen.push(args);
          try {
            await withStdoutToStderr({
              operation: async () => console.log('3 blockers'),
            });
            expect(logSeen).toEqual([]);
            expect(errSeen).toContainEqual(['3 blockers']);
          } finally {
            console.log = logOriginal;
            console.error = errorOriginal;
          }
        },
      );
    });
  });

  given('[case2] an operation that throws', () => {
    when('[t0] it runs inside the reroute', () => {
      then(
        '🔴 stdout is restored, so a throw never leaves the process rerouted',
        async () => {
          const logBefore = console.log;
          const writeBefore = process.stdout.write;
          const error = await getError(
            withStdoutToStderr({
              operation: async () => {
                throw new Error('boom');
              },
            }),
          );
          expect(error.message).toEqual('boom');
          expect(console.log).toBe(logBefore);
          expect(process.stdout.write).toBe(writeBefore);
        },
      );
    });
  });

  given('[case3] a second owner while the swap is held', () => {
    when('[t0] a claim arrives while another owner is in', () => {
      then(
        '🔴 the second claim fails loud, and the first owner still restores whole',
        async () => {
          const errorOriginal = console.error;
          console.error = () => {};
          const logBefore = console.log;
          const writeBefore = process.stdout.write;
          try {
            const gate: { open: () => void } = { open: () => {} };
            const owner = withStdoutToStderr({
              operation: () =>
                new Promise<string>((settle) => {
                  gate.open = () => settle('owner');
                }),
            });
            const error = await getError(
              withStdoutToStderr({ operation: async () => 'second' }),
            );
            const isStillSwappedAfterRefusal = console.log !== logBefore;
            gate.open();
            expect(await owner).toEqual('owner');
            expect(error.message).toContain('already held');
            expect(isStillSwappedAfterRefusal).toEqual(true);
            expect(console.log).toBe(logBefore);
            expect(process.stdout.write).toBe(writeBefore);
          } finally {
            console.error = errorOriginal;
          }
        },
      );
    });

    when('[t1] a fresh call follows the outer one', () => {
      then('it runs, since the outer call released the swap', async () => {
        const result = await withStdoutToStderr({
          operation: async () => 'ran',
        });
        expect(result).toEqual('ran');
      });
    });
  });

  given('[case4] a writer outside the operation while the swap is held', () => {
    when('[t0] the host writes to stdout beside the operation', () => {
      then(
        "🔴 the host's write reaches stdout; only the operation's write is rerouted",
        async () => {
          const errorOriginal = console.error;
          const errSeen: unknown[][] = [];
          console.error = (...args: unknown[]) => void errSeen.push(args);
          const logOriginal = console.log;
          const logSeen: unknown[][] = [];
          console.log = (...args: unknown[]) => logSeen.push(args);
          try {
            const gate: { open: () => void } = { open: () => {} };
            const owner = withStdoutToStderr({
              operation: async () => {
                await new Promise<void>((settle) => {
                  gate.open = settle;
                });
                console.log('3 blockers');
              },
            });
            console.log('host line');
            gate.open();
            await owner;
            expect(logSeen).toEqual([['host line']]);
            expect(errSeen).toContainEqual(['3 blockers']);
            expect(errSeen).not.toContainEqual(['host line']);
          } finally {
            console.log = logOriginal;
            console.error = errorOriginal;
          }
        },
      );
    });
  });
});
