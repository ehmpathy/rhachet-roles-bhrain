import * as path from 'path';
import { given, then, when } from 'test-fns';

import { asRouteDisplayPath } from './asRouteDisplayPath';

describe('asRouteDisplayPath', () => {
  given('[case1] the route IS the cwd', () => {
    when('[t0] asRouteDisplayPath is called with route = cwd', () => {
      then('it renders "." (never an empty string)', () => {
        expect(asRouteDisplayPath({ route: process.cwd() })).toEqual('.');
      });
    });
  });

  given('[case2] the route is a subdir of the cwd', () => {
    when('[t0] asRouteDisplayPath is called', () => {
      then('it renders the relative subdir path', () => {
        const route = path.join(process.cwd(), 'foo', 'bar');
        expect(asRouteDisplayPath({ route })).toEqual(path.join('foo', 'bar'));
      });
    });
  });

  given('[case3] the route is outside the cwd', () => {
    when('[t0] asRouteDisplayPath is called', () => {
      then('it renders an ascending relative path (no absolute prefix)', () => {
        const route = path.join(process.cwd(), '..', 'sibling');
        const rendered = asRouteDisplayPath({ route });
        expect(rendered).toEqual(path.join('..', 'sibling'));
        // never an absolute path — the display path is always relative to cwd
        expect(path.isAbsolute(rendered)).toBe(false);
      });
    });
  });
});
