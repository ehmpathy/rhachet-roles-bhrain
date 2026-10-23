import { asBrainAtomSlugFromTranscriptModel } from './asBrainAtomSlugFromTranscriptModel';

const TEST_CASES = [
  {
    description: 'family-first id with a date suffix',
    given: { model: 'claude-opus-4-5-20251101' },
    expect: { slug: 'claude/opus/v4.5' },
  },
  {
    description: 'family-first id with a major version only',
    given: { model: 'claude-sonnet-4-20250514' },
    expect: { slug: 'claude/sonnet/v4' },
  },
  {
    description: 'family-first id with no date',
    given: { model: 'claude-opus-5-5' },
    expect: { slug: 'claude/opus/v5.5' },
  },
  {
    description: 'a context-window tag is dropped',
    given: { model: 'claude-opus-5-5[1m]' },
    expect: { slug: 'claude/opus/v5.5' },
  },
  {
    description: 'version-first id',
    given: { model: 'claude-3-5-haiku-20241022' },
    expect: { slug: 'claude/haiku/v3.5' },
  },
  {
    description: 'a non-claude model names no slug',
    given: { model: 'gpt-5' },
    expect: { slug: null },
  },
  {
    description: 'the synthetic model names no slug',
    given: { model: '<synthetic>' },
    expect: { slug: null },
  },
];

describe('asBrainAtomSlugFromTranscriptModel', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asBrainAtomSlugFromTranscriptModel(thisCase.given)).toEqual(
        thisCase.expect.slug,
      );
    }),
  );
});
