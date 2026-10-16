import { given, then, when } from 'test-fns';

import { parseReflectArgs } from './reflect';

/**
 * .what = clamp: a reflect flag typed with no value is recorded, never dropped
 * .why = the parser once fell through on a bare `--target`, so the flag read as absent and
 *        the run went on with a default the caller never chose
 */
describe('parseReflectArgs', () => {
  given('[case1] every flag carries its value', () => {
    when('[t0] parsed', () => {
      then('no flag is recorded as valueless', () => {
        const options = parseReflectArgs([
          'node',
          'reflect',
          '--source',
          'feedback',
          '--target',
          'briefs',
        ]);
        expect(options.source).toEqual('feedback');
        expect(options.target).toEqual('briefs');
        expect(options.valuelessFlags).toEqual([]);
      });
    });
  });

  given('[case2] a flag at the tail with no value', () => {
    when('[t0] parsed', () => {
      then('the flag is recorded as valueless', () => {
        const options = parseReflectArgs([
          'node',
          'reflect',
          '--source',
          'feedback',
          '--target',
        ]);
        expect(options.valuelessFlags).toEqual(['--target']);
      });
    });
  });

  given('[case3] a flag followed directly by another flag', () => {
    when('[t0] parsed', () => {
      then(
        'the first flag is recorded as valueless, the second still reads',
        () => {
          const options = parseReflectArgs([
            'node',
            'reflect',
            '--source',
            '--target',
            'briefs',
          ]);
          expect(options.valuelessFlags).toEqual(['--source']);
          expect(options.target).toEqual('briefs');
        },
      );
    });
  });

  given('[case4] the boolean --force flag', () => {
    when('[t0] parsed with no value', () => {
      then('it is never recorded as valueless', () => {
        const options = parseReflectArgs([
          'node',
          'reflect',
          '--force',
          '--source',
          'feedback',
        ]);
        expect(options.force).toEqual(true);
        expect(options.valuelessFlags).toEqual([]);
      });
    });
  });

  given('[case5] a flag reflect does not read', () => {
    when('[t0] parsed', () => {
      then('the flag is recorded as unknown, never dropped in silence', () => {
        const options = parseReflectArgs([
          'node',
          'reflect',
          '--source',
          'feedback',
          '--targt',
          'briefs',
        ]);
        expect(options.unknownFlags).toEqual(['--targt']);
      });
    });
  });

  given('[case6] the dispatcher flags rhachet forwards verbatim', () => {
    when('[t0] parsed', () => {
      then('they are known, never collected as unknown', () => {
        const options = parseReflectArgs([
          'node',
          'reflect',
          '--skill',
          'reflect',
          '--repo',
          'bhrain',
          '--source',
          'feedback',
        ]);
        expect(options.unknownFlags).toEqual([]);
        expect(options.source).toEqual('feedback');
      });
    });
  });
});
