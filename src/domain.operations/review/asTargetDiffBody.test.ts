import { asTargetDiffBody } from './asTargetDiffBody';

/**
 * .what = data-driven cases for asTargetDiffBody across change kinds
 * .why = the renderer and the token fold both read this; an addition sends its plain
 *        body, a mutation its hunks, a deletion none — a drift here splits the estimate
 *        from the render
 */
const CASES: {
  description: string;
  target: Parameters<typeof asTargetDiffBody>[0]['target'];
  expected: string;
}[] = [
  {
    description: 'a deletion → no body',
    target: { content: 'gone\n', diff: '-gone\n', changeKind: 'deleted' },
    expected: '',
  },
  {
    description: 'an addition → its plain content, never the + form',
    target: { content: 'fresh\n', diff: '+fresh\n', changeKind: 'new' },
    expected: 'fresh\n',
  },
  {
    description: 'an addition with no content → no body',
    target: { content: null, diff: null, changeKind: 'new' },
    expected: '',
  },
  {
    description: 'an edit → its hunks',
    target: { content: 'b\n', diff: '-a\n+b\n', changeKind: 'edited' },
    expected: '-a\n+b\n',
  },
  {
    description: 'an edit with no diff → no body',
    target: { content: 'b\n', diff: null, changeKind: 'edited' },
    expected: '',
  },
];

describe('asTargetDiffBody', () => {
  CASES.forEach((thisCase) =>
    test(thisCase.description, () => {
      expect(asTargetDiffBody({ target: thisCase.target })).toEqual(
        thisCase.expected,
      );
    }),
  );
});
