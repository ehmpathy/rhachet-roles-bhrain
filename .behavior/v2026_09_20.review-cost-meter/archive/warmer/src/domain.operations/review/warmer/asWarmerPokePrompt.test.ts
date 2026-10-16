import { given, then, useThen, when } from 'test-fns';

import {
  asWarmerPokePrompt,
  CHARS_OF_POKE_TAIL_MAX,
} from './asWarmerPokePrompt';

describe('asWarmerPokePrompt', () => {
  given('[case1] a run whose head prefixes its prompt', () => {
    const head = '# rules\n\nbe kind.\n';
    const tail = '<target.file path="a.ts">const a = 1;</target.file>';

    when('[t0] the poke prompt is built', () => {
      const built = useThen('it builds', () => ({
        poke: asWarmerPokePrompt({ head, prompt: head + tail }),
      }));

      then('🔴 the head is byte-identical — it is what derives the pin', () => {
        expect(built.poke?.head).toEqual(head);
      });

      then('the tail is the remainder, never the whole prompt', () => {
        expect(built.poke?.tail).toEqual(tail);
      });

      then('the two slots recompose to the original prompt', () => {
        expect(`${built.poke?.head}${built.poke?.tail}`).toEqual(head + tail);
      });
    });
  });

  given('[case2] a tail longer than the replay cap', () => {
    const head = '# rules\n';
    const tail = 'x'.repeat(CHARS_OF_POKE_TAIL_MAX + 5_000);

    when('[t0] the poke prompt is built', () => {
      const built = useThen('it builds', () => ({
        poke: asWarmerPokePrompt({ head, prompt: head + tail }),
      }));

      then('the tail is truncated to the cap', () => {
        expect(built.poke?.tail.length).toEqual(CHARS_OF_POKE_TAIL_MAX);
      });

      then('🔴 the HEAD survives whole, however long the tail', () => {
        // a truncated head would re-derive the affinity key and warm a replica
        // the real call never reaches — silently
        expect(built.poke?.head).toEqual(head);
      });

      then(
        'the kept tail is the FRONT, since a cache serves from token 0',
        () => {
          const marked = `LEAD${'x'.repeat(CHARS_OF_POKE_TAIL_MAX)}`;
          const poke = asWarmerPokePrompt({ head, prompt: head + marked });
          expect(poke?.tail.startsWith('LEAD')).toEqual(true);
        },
      );
    });
  });

  given('[case3] a head that does NOT prefix the prompt', () => {
    when('[t0] the artifacts disagree', () => {
      then('🔴 it REFUSES rather than warms a prefix nobody sent', () => {
        const poke = asWarmerPokePrompt({
          head: '# rules that were never sent\n',
          prompt: '# a different head\n<target.file path="a.ts"/>',
        });
        expect(poke).toEqual(null);
      });

      then('an empty prompt against a real head also refuses', () => {
        const poke = asWarmerPokePrompt({ head: '# rules\n', prompt: '' });
        expect(poke).toEqual(null);
      });
    });
  });

  given('[case4] a head with no tail after it', () => {
    when('[t0] the prompt is exactly the head', () => {
      then('it yields an empty tail rather than a refusal', () => {
        const head = '# rules\n';
        const poke = asWarmerPokePrompt({ head, prompt: head });
        expect(poke).toEqual({ head, tail: '' });
      });
    });
  });
});
