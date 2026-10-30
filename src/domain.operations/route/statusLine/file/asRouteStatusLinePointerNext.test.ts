import { asRouteStatusLinePointerNext } from './asRouteStatusLinePointerNext';
import { MARK_OF_MULTI_BIND } from './MARK_OF_MULTI_BIND';

const TEST_CASES = [
  {
    description: 'no pointer → names this route',
    given: { pointerFound: null, route: 'r/a', isPeerFlagPresent: false },
    expect: { output: 'r/a' },
  },
  {
    description: 'a pointer to this route → names this route',
    given: { pointerFound: 'r/a', route: 'r/a', isPeerFlagPresent: false },
    expect: { output: 'r/a' },
  },
  {
    description: 'the multi-bind mark → left as is',
    given: {
      pointerFound: MARK_OF_MULTI_BIND,
      route: 'r/a',
      isPeerFlagPresent: false,
    },
    expect: { output: null },
  },
  {
    description: 'another route whose flag stands → the multi-bind mark',
    given: { pointerFound: 'r/b', route: 'r/a', isPeerFlagPresent: true },
    expect: { output: MARK_OF_MULTI_BIND },
  },
  {
    description: 'another route whose flag is gone → names this route',
    given: { pointerFound: 'r/b', route: 'r/a', isPeerFlagPresent: false },
    expect: { output: 'r/a' },
  },
];

describe('asRouteStatusLinePointerNext', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asRouteStatusLinePointerNext(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
