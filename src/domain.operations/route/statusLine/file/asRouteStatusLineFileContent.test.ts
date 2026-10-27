import { given, then, when } from 'test-fns';

import { asRouteStatusLineFileContent } from './asRouteStatusLineFileContent';

/**
 * .what = the bytes contract the bash reader parses with one regex, `"line":"(.*)"}$`
 * .why = the reader is exact, not a json parser: a key order change, a pretty print, or a
 *        line moved off the end would turn every repaint into `status unknown`
 */
const TEST_CASES: {
  description: string;
  given: Parameters<typeof asRouteStatusLineFileContent>[0];
  expect: { content: string };
}[] = [
  {
    description: 'a stone mid-route: compact, keys in order, `line` last',
    given: {
      route: '.behavior/x',
      stone: '1.vision',
      phase: 'yield',
      line: '🗿 1.vision, yield 🌾',
    },
    expect: {
      content:
        '{"route":".behavior/x","stone":"1.vision","phase":"yield","line":"🗿 1.vision, yield 🌾"}\n',
    },
  },
  {
    description: 'a complete route: null stone and phase, still `line` last',
    given: {
      route: '.behavior/x',
      stone: null,
      phase: null,
      line: '🗿 route complete 🌴🤙',
    },
    expect: {
      content:
        '{"route":".behavior/x","stone":null,"phase":null,"line":"🗿 route complete 🌴🤙"}\n',
    },
  },
  {
    description: 'a line with a quote and a backslash: both escaped',
    given: {
      route: '.behavior/x',
      stone: '1.vision',
      phase: 'yield',
      line: 'a "q" \\b',
    },
    expect: {
      content:
        '{"route":".behavior/x","stone":"1.vision","phase":"yield","line":"a \\"q\\" \\\\b"}\n',
    },
  },
];

describe('asRouteStatusLineFileContent', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the content is rendered', () => {
        then('it is one line the reader regex matches whole', () => {
          const content = asRouteStatusLineFileContent(thisCase.given);
          expect(content).toEqual(thisCase.expect.content);
          expect(content.split('\n')).toHaveLength(2);
          expect(content.trimEnd()).toMatch(/"line":"(.*)"}$/);
        });
      });
    }),
  );
});
