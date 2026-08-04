import { asExitCodeFromArtifactContent } from './asExitCodeFromArtifactContent';

/**
 * .what = unit cases for asExitCodeFromArtifactContent — the single exit-code parse over a guard
 *         artifact's content.
 * .why = three call sites re-derived this parse; pin the one truth here. it reads both `exit code: N`
 *        and `exit code N` (optional colon, case-insensitive) and defaults to 0 when absent.
 */
const CASES: Array<{
  description: string;
  given: { content: string };
  expect: number;
}> = [
  {
    description: 'colon form "exit code: 2" → 2',
    given: { content: 'passage blocked\nexit code: 2\n' },
    expect: 2,
  },
  {
    description: 'colon-less form "exit code 1" → 1',
    given: { content: 'judge crashed, exit code 1' },
    expect: 1,
  },
  {
    description: 'uppercase "Exit Code: 127" → 127',
    given: { content: 'Exit Code: 127' },
    expect: 127,
  },
  {
    description: 'explicit "exit code: 0" → 0',
    given: { content: 'exit code: 0' },
    expect: 0,
  },
  {
    description: 'no footer → 0 (defaults to passed)',
    given: { content: 'a review with no exit footer at all' },
    expect: 0,
  },
];

describe('asExitCodeFromArtifactContent', () => {
  CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const result = asExitCodeFromArtifactContent({
        content: thisCase.given.content,
      });
      expect(result).toEqual(thisCase.expect);
    }),
  );
});
