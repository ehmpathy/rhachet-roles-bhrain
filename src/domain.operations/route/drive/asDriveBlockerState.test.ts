import { UnexpectedCodePathError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import {
  asDriveBlockerState,
  asFreshDriveBlockerState,
} from './asDriveBlockerState';

describe('asDriveBlockerState', () => {
  given('well-formed json content', () => {
    when('it carries a count and a stone', () => {
      then('both are parsed through', () => {
        const state = asDriveBlockerState({
          content: JSON.stringify({ count: 3, stone: '2' }),
        });
        expect(state.count).toEqual(3);
        expect(state.stone).toEqual('2');
      });
    });

    when('a field is absent', () => {
      then('count defaults to 0 and stone to null', () => {
        const state = asDriveBlockerState({ content: '{}' });
        expect(state.count).toEqual(0);
        expect(state.stone).toEqual(null);
      });
    });
  });

  given('a brain inheritance record (F30)', () => {
    const asState = (brain: unknown) =>
      asDriveBlockerState({
        content: JSON.stringify({ count: 0, stone: '2', brain }),
      });

    when('it carries a slug, an effort, and a stone', () => {
      then('all three are parsed through', () => {
        const state = asState({ slug: 'opus', effort: 'high', stone: '1' });
        expect(state.brain?.slug).toEqual('opus');
        expect(state.brain?.effort).toEqual('high');
        expect(state.brain?.stone).toEqual('1');
      });
    });

    when('it is an older record, written before effort was recorded', () => {
      then('the absent effort reads as null, never a throw', () => {
        const state = asState({ slug: 'opus', stone: '1' });
        expect(state.brain?.slug).toEqual('opus');
        expect(state.brain?.effort).toEqual(null);
      });
    });

    when('it carries an effort alone — only an `/effort` was ever sent', () => {
      then('the null slug is parsed through', () => {
        const state = asState({ slug: null, effort: 'low', stone: '1' });
        expect(state.brain?.slug).toEqual(null);
        expect(state.brain?.effort).toEqual('low');
      });
    });

    when('it carries neither a slug nor an effort', () => {
      then(
        'it fails loud — a record of no dispatch attributes naught',
        async () => {
          const error = await getError(async () =>
            asState({ slug: null, effort: null, stone: '1' }),
          );
          expect(error.message).toContain('brain');
        },
      );
    });
  });

  given('EMPTY content (a benign absence)', () => {
    // the atomic rename in mutateDriveBlockerState precludes a torn read, so an empty
    // file means "no state yet", the same benign absence ENOENT is one layer up
    when('the content is the empty string', () => {
      then('it degrades to fresh state', () => {
        const state = asDriveBlockerState({ content: '' });
        expect(state).toEqual(asFreshDriveBlockerState());
      });
    });

    when('the content is whitespace only', () => {
      then('it degrades to fresh state', () => {
        const state = asDriveBlockerState({ content: '  \n ' });
        expect(state).toEqual(asFreshDriveBlockerState());
      });
    });
  });

  given('PRESENT-but-unreadable content (a corrupt state file)', () => {
    // 🔴 the clamp on the failhide: a non-empty file that will not parse is a genuinely
    //    corrupt state file, NOT a torn write (the atomic rename precludes that). to
    //    degrade it to fresh would silently re-arm the 21-block cutoff to 0 and clear the
    //    entry marker. it MUST fail loud (`rule.forbid.failhide`).
    when('the content is truncated json', () => {
      then('it throws a MalfunctionError, never a silent reset', async () => {
        const error = await getError(async () =>
          asDriveBlockerState({ content: '{"count": 3, "sto' }),
        );
        expect(error).toBeInstanceOf(UnexpectedCodePathError);
        expect(error.message).toContain('not readable json');
      });
    });

    when('the content is non-json garbage', () => {
      then('it throws a MalfunctionError', async () => {
        const error = await getError(async () =>
          asDriveBlockerState({ content: 'not json at all' }),
        );
        expect(error).toBeInstanceOf(UnexpectedCodePathError);
      });
    });
  });
});
