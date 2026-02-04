import { given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { computeStoneOrderPrefix } from './computeStoneOrderPrefix';

describe('computeStoneOrderPrefix', () => {
  given('[case1] a stone with single digit prefix', () => {
    const stone = new RouteStone({
      name: '1.vision',
      path: '/route/1.vision.stone',
      guard: null,
    });

    when('[t0] prefix is computed', () => {
      then('returns "1"', () => {
        const result = computeStoneOrderPrefix({ stone });
        expect(result).toEqual('1');
      });
    });
  });

  given('[case2] a stone with multi-level numeric prefix', () => {
    const stone = new RouteStone({
      name: '3.1.research.domain',
      path: '/route/3.1.research.domain.stone',
      guard: null,
    });

    when('[t0] prefix is computed', () => {
      then('returns "3.1"', () => {
        const result = computeStoneOrderPrefix({ stone });
        expect(result).toEqual('3.1');
      });
    });
  });

  given('[case3] a stone with three-level numeric prefix', () => {
    const stone = new RouteStone({
      name: '3.1.2.deep.nested',
      path: '/route/3.1.2.deep.nested.stone',
      guard: null,
    });

    when('[t0] prefix is computed', () => {
      then('returns "3.1.2"', () => {
        const result = computeStoneOrderPrefix({ stone });
        expect(result).toEqual('3.1.2');
      });
    });
  });

  given('[case4] a stone with no numeric prefix', () => {
    const stone = new RouteStone({
      name: 'vision.stone',
      path: '/route/vision.stone',
      guard: null,
    });

    when('[t0] prefix is computed', () => {
      then('returns empty string', () => {
        const result = computeStoneOrderPrefix({ stone });
        expect(result).toEqual('');
      });
    });
  });
});
