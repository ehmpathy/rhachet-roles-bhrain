import { given, then } from 'test-fns';

import { asHeadersOrphanedOfText } from './asHeadersOrphanedOfText';

const TEST_CASES = [
  {
    description: 'a header with a body is not an orphan',
    given: { text: '# title\n\n## .why\n\nbody\n' },
    expect: { output: [] },
  },
  {
    description: 'a header followed by a peer header is an orphan',
    given: { text: '# title\n## .why\n## .how\nbody\n' },
    expect: { output: ['f :: ## .why'] },
  },
  {
    description: 'a header followed by a shallower header is an orphan',
    given: { text: '# title\n## .a\n### .b\n## .c\nbody\n' },
    expect: { output: ['f :: ### .b'] },
  },
  {
    description:
      'a header whose only content is a deeper header is not an orphan',
    given: { text: '# title\n## .a\n### .b\nbody\n' },
    expect: { output: [] },
  },
  {
    description: 'a header on the last line is an orphan',
    given: { text: '# title\nbody\n## .tail\n' },
    expect: { output: ['f :: ## .tail'] },
  },
  {
    description: 'the depth-1 title is never checked',
    given: { text: '# title\n' },
    expect: { output: [] },
  },
  {
    description: 'a shell comment inside a fence is not a header',
    given: { text: '# title\n## .how\n```sh\n# a comment\n```\n' },
    expect: { output: [] },
  },
  {
    description: 'a section whose only content is a fence is not an orphan',
    given: { text: '# title\n## .shape\n```\nx\n```\n## .next\nbody\n' },
    expect: { output: [] },
  },
];

describe('asHeadersOrphanedOfText', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then('it names exactly the orphaned headers', () => {
        expect(
          asHeadersOrphanedOfText({ file: 'f', text: thisCase.given.text }),
        ).toEqual(thisCase.expect.output);
      });
    }),
  );
});
