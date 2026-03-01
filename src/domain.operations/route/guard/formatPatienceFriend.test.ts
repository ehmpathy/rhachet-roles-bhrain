import { given, then, when } from 'test-fns';

import { formatPatienceFriend } from './formatPatienceFriend';

describe('formatPatienceFriend', () => {
  given('[case1] challenged review.self', () => {
    when('[t0] formatPatienceFriend called', () => {
      then('output matches snapshot (vibecheck)', () => {
        const output = formatPatienceFriend();

        expect(output).toMatchSnapshot();
      });

      then('contains stone header', () => {
        const output = formatPatienceFriend();

        expect(output).toContain('🗿 patience, friend');
      });

      then('contains zen challenge sections', () => {
        const output = formatPatienceFriend();

        expect(output).toContain('the pond barely rippled');
        expect(output).toContain('truly?');
        expect(output).toContain('was each pebble turned?');
        expect(output).toContain('each line read with care?');
        expect(output).toContain('did stillness guide you?');
        expect(output).toContain('did clarity follow?');
      });

      then('contains final wisdom', () => {
        const output = formatPatienceFriend();

        expect(output).toContain('the pond awaits. in time, all is clear 🌙');
      });
    });
  });
});
