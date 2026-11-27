import { ConstraintError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { asEducationArgs } from './asEducationArgs';
import { asEducationFlagOne } from './asEducationFlagOne';

const FLAGS_OF_VERB = { init: ['--for', '--slug', '--course'], exit: [] };

/**
 * .what = an argv as node hands it: the runtime, the entry file, then the caller args
 */
const asArgv = (input: { args: string[] }): string[] => [
  'node',
  'education.pursuit.js',
  ...input.args,
];

describe('asEducationArgs', () => {
  given('[case1] a call the harness prefixed with its own block', () => {
    when('[t0] the caller passed --for and courses', () => {
      const parsed = asEducationArgs({
        argv: asArgv({
          args: [
            '--skill',
            'education.pursuit',
            '--role',
            'learner',
            '--repo',
            'bhrain',
            'init',
            '--for',
            'mechanic',
            '--course=idempotency',
            '--course',
            'retries',
          ],
        }),
        flagsOfVerb: FLAGS_OF_VERB,
      });

      then('the harness flags are dropped and --for reads the target', () => {
        expect(parsed.flags['--for']).toEqual(['mechanic']);
        expect(parsed.flags['--role']).toBeUndefined();
      });

      then('a bare word reads as a verb word', () => {
        expect(parsed.words).toEqual(['init']);
      });

      then('both --flag=value and --flag value forms collect', () => {
        expect(parsed.flags['--course']).toEqual(['idempotency', 'retries']);
      });

      then('no help was asked', () => {
        expect(parsed.help).toEqual(false);
      });
    });

    when('[t1] the harness flags trail the verb', () => {
      then(
        'they are dropped wherever they sit, and the verb still reads',
        () => {
          const parsed = asEducationArgs({
            argv: asArgv({
              args: [
                'init',
                '--skill',
                'education.pursuit',
                '--role',
                'learner',
              ],
            }),
            flagsOfVerb: FLAGS_OF_VERB,
          });
          expect(parsed.flags['--role']).toBeUndefined();
          expect(parsed.flags['--for']).toBeUndefined();
          expect(parsed.words).toEqual(['init']);
        },
      );
    });
  });

  given('[case2] a call that asks for help', () => {
    when('[t0] -h is passed', () => {
      then('help is true and -h is no verb word', () => {
        const parsed = asEducationArgs({
          argv: asArgv({ args: ['init', '-h'] }),
          flagsOfVerb: FLAGS_OF_VERB,
        });
        expect(parsed.help).toEqual(true);
        expect(parsed.words).toEqual(['init']);
      });
    });
  });

  given('[case3] a call with a flag the face does not know', () => {
    when('[t0] it is parsed', () => {
      then('it refuses, and the fix lists the known flags', async () => {
        const error = await getError(async () =>
          asEducationArgs({
            argv: asArgv({ args: ['init', '--rol', 'mechanic'] }),
            flagsOfVerb: FLAGS_OF_VERB,
          }),
        );
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('unknown flag --rol');
        expect(error.message).toContain('--for, --slug, --course');
      });
    });
  });

  given(
    '[case6] an unknown flag passed to a verb that reads fewer flags than its face',
    () => {
      when('[t0] get is passed a typo of --for', () => {
        then(
          'the fix lists only the flags get reads, never a peer verb flag',
          async () => {
            const error = await getError(async () =>
              asEducationArgs({
                argv: asArgv({ args: ['get', '--fro', 'mechanic'] }),
                flagsOfVerb: { get: ['--for'], set: ['--from'] },
              }),
            );
            expect(error).toBeInstanceOf(ConstraintError);
            expect(error.message).toContain('unknown flag --fro');
            expect(error.message).toContain('use one of: --for');
            expect(error.message).not.toContain('--from');
          },
        );
      });

      when('[t1] the unknown flag precedes the verb word', () => {
        then(
          'the verb is still read, and the fix lists its flags',
          async () => {
            const error = await getError(async () =>
              asEducationArgs({
                argv: asArgv({ args: ['--fro', 'mechanic', 'get'] }),
                flagsOfVerb: { get: ['--for'], set: ['--from'] },
              }),
            );
            expect(error).toBeInstanceOf(ConstraintError);
            expect(error.message).toContain('use one of: --for');
            expect(error.message).not.toContain('--from');
          },
        );
      });

      when('[t2] no known verb is named', () => {
        then('the fix lists every flag of the face', async () => {
          const error = await getError(async () =>
            asEducationArgs({
              argv: asArgv({ args: ['--fro', 'mechanic'] }),
              flagsOfVerb: { get: ['--for'], set: ['--from'] },
            }),
          );
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('use one of: --for, --from');
        });
      });
    },
  );

  given('[case5] a verb passed a flag it does not read', () => {
    when('[t0] exit is passed --course', () => {
      then('it refuses, and says exit reads no flag', async () => {
        const error = await getError(async () =>
          asEducationArgs({
            argv: asArgv({ args: ['exit', '--course', 'retries'] }),
            flagsOfVerb: FLAGS_OF_VERB,
          }),
        );
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('exit does not read --course');
        expect(error.message).toContain('exit reads no flag; drop --course');
      });
    });
  });

  given('[case4] a call whose last flag has no value', () => {
    when('[t0] it is parsed', () => {
      then('it refuses, and the fix shows the value form', async () => {
        const error = await getError(async () =>
          asEducationArgs({
            argv: asArgv({ args: ['init', '--slug'] }),
            flagsOfVerb: FLAGS_OF_VERB,
          }),
        );
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('--slug needs a value');
        expect(error.message).toContain('pass --slug <value>');
      });
    });
  });
});

describe('asEducationFlagOne', () => {
  given('[case1] a single-value flag', () => {
    when('[t0] it is absent', () => {
      then('it reads null', () => {
        expect(asEducationFlagOne({ flags: {}, flag: '--slug' })).toBeNull();
      });
    });

    when('[t1] it is passed once', () => {
      then('it reads its value', () => {
        expect(
          asEducationFlagOne({
            flags: { '--slug': ['reliable-writes'] },
            flag: '--slug',
          }),
        ).toEqual('reliable-writes');
      });
    });

    when('[t2] it is passed twice', () => {
      then('it refuses, and the fix says to pass it once', async () => {
        const error = await getError(async () =>
          asEducationFlagOne({
            flags: { '--slug': ['a', 'b'] },
            flag: '--slug',
          }),
        );
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('--slug takes one value');
        expect(error.message).toContain('pass --slug once');
      });
    });
  });
});
