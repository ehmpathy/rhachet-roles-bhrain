import { UnexpectedCodePathError } from 'helpful-errors';

import { asDefectBodySansClassLabels } from './asDefectBodySansClassLabels';

const TEST_CASES = [
  {
    description: 'a plain Error loses its one label',
    given: { error: new Error('log dir torn') },
    expect: { output: 'log dir torn' },
  },
  {
    description: 'a HelpfulError loses every stacked label',
    given: {
      error: new Error(
        String(new UnexpectedCodePathError('artifact present but unparseable')),
      ),
    },
    expect: { output: 'artifact present but unparseable' },
  },
  {
    description: 'a label mid-message is prose, and stays',
    given: { error: new Error('the brain said TypeError: nope') },
    expect: { output: 'the brain said TypeError: nope' },
  },
  {
    description: 'a thrown non-Error renders as its own text',
    given: { error: 'a bare string' },
    expect: { output: 'a bare string' },
  },
];

describe('asDefectBodySansClassLabels', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asDefectBodySansClassLabels({ error: thisCase.given.error }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
