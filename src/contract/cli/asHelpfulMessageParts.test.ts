import { BadRequestError } from 'helpful-errors';

import { asHelpfulMessageParts } from './asHelpfulMessageParts';

const TEST_CASES = [
  {
    description: 'a message with no bag is all headline',
    given: { message: 'gh: not found' },
    expect: { headline: 'gh: not found', metadata: null, hint: null },
  },
  {
    description: 'a bag with a hint parts into headline, metadata, and hint',
    given: {
      message:
        'no latest map\n\n{\n  "choice": "nowhere/x",\n  "hint": "pass a pinned slug"\n}',
    },
    expect: {
      headline: 'no latest map',
      metadata: { choice: 'nowhere/x', hint: 'pass a pinned slug' },
      hint: 'pass a pinned slug',
    },
  },
  {
    description: 'a bag with no hint answers a null hint',
    given: { message: 'faulted\n\n{\n  "key": "k"\n}' },
    expect: { headline: 'faulted', metadata: { key: 'k' }, hint: null },
  },
  {
    description: 'a multi-line body keeps every line above the bag',
    given: {
      message: 'line one\n\nline two\n\n{\n  "slug": "a"\n}',
    },
    expect: {
      headline: 'line one\n\nline two',
      metadata: { slug: 'a' },
      hint: null,
    },
  },
  {
    description: 'a tail that is not a json object stays in the headline',
    given: { message: 'oops\n\n{ not json' },
    expect: { headline: 'oops\n\n{ not json', metadata: null, hint: null },
  },
];

describe('asHelpfulMessageParts', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asHelpfulMessageParts(thisCase.given)).toEqual(thisCase.expect);
    }),
  );

  test('it parts the message a real helpful-errors throw composes', () => {
    // the format is the package's, so the clamp reads a real error, never a guess
    const error = new BadRequestError('no latest map', {
      hint: 'pass a pinned slug',
    });
    const parts = asHelpfulMessageParts({ message: error.message });
    expect(parts.hint).toEqual('pass a pinned slug');
    expect(parts.headline).not.toContain('{');
  });
});
