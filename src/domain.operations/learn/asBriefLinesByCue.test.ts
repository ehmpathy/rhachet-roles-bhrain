import { given, then, when } from 'test-fns';

import { asBriefLinesByCue } from './asBriefLinesByCue';

const TEST_CASES = [
  {
    description: 'a table row, a blockquote, a bullet, and a header are cues',
    given: {
      text: [
        '# rule.require.probe',
        '| when… | then… |',
        '> the claim',
        '- a bullet',
        '1. an ordinal bullet',
      ].join('\n'),
    },
    expect: {
      cueLines: [
        '# rule.require.probe',
        '| when… | then… |',
        '> the claim',
        '- a bullet',
        '1. an ordinal bullet',
      ],
      argLines: [],
    },
  },
  {
    description: 'an enforcement line is a cue; plain prose is argument',
    given: {
      text: [
        'the reason this holds is a long story.',
        'blocker: a cue cut to reach a number',
        'false positive: a one-line ground',
      ].join('\n'),
    },
    expect: {
      cueLines: [
        'blocker: a cue cut to reach a number',
        'false positive: a one-line ground',
      ],
      argLines: ['the reason this holds is a long story.'],
    },
  },
  {
    description: 'a test line written as prose is a cue',
    given: {
      text: [
        'it is synonym sprawl caught in the wild.',
        'test: **"is this concept named the same way everywhere?"** one word → consistent',
      ].join('\n'),
    },
    expect: {
      cueLines: [
        'test: **"is this concept named the same way everywhere?"** one word → consistent',
      ],
      argLines: ['it is synonym sprawl caught in the wild.'],
    },
  },
  {
    description: 'every line inside a fence is a cue, fence marks included',
    given: {
      text: [
        'prose before',
        '```ts',
        'const x = 1;',
        '```',
        'prose after',
      ].join('\n'),
    },
    expect: {
      cueLines: ['```ts', 'const x = 1;', '```'],
      argLines: ['prose before', 'prose after'],
    },
  },
  {
    description: 'blank lines are neither cue nor argument',
    given: { text: '\n\n   \n' },
    expect: { cueLines: [], argLines: [] },
  },
];

describe('asBriefLinesByCue', () => {
  TEST_CASES.forEach((thisCase, index) => {
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the brief is sorted', () => {
        then('it sorts each line into cue or argument', () => {
          expect(asBriefLinesByCue({ text: thisCase.given.text })).toEqual(
            thisCase.expect,
          );
        });
      });
    });
  });
});
