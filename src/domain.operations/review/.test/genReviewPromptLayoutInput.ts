import { asIsoPrice } from 'iso-price';

import type { compileReviewPrompt } from '@src/domain.operations/review/compileReviewPrompt';

/**
 * .what = the dir that holds each layout fixture's prompt as the prior compiler sent it
 * .why = the content clamp compares a prompt of today's layout to one the prior layout
 *        wrote. the prior compiler is gone from the tree, so its output is kept on disk
 */
export const DIR_OF_LAYOUT_FIXTURES =
  'src/domain.operations/review/.test/assets/example.layout';

/**
 * .what = one review input that exercises every block a prompt can carry
 * .why = a layout change moves blocks; a clamp over an input that lacks a block cannot see
 *        that block dropped or doubled. so it holds two rules, a ref, a conversation turn, and
 *        a target of each change kind — an edit, an addition, and a deletion
 */
const INPUT_OF_WHOLE_RUN: Parameters<typeof compileReviewPrompt>[0] = {
  rules: [
    {
      path: 'rules/rule.forbid.console.md',
      content: '# rule.forbid.console\n\nforbid console.log in prod code',
    },
    {
      path: 'rules/rule.require.arrow-only.md',
      content: '# rule.require.arrow-only\n\nrequire arrow functions',
    },
  ],
  refs: [{ path: 'refs/glossary.md', content: '# glossary\n\nwave = a swell' }],
  conversation: [
    {
      path: '.reviews/peer/r1.given.by_peer.md',
      content: '1 blocker\n0 nitpicks\n\nblocker.1: console.log in surf.ts',
    },
  ],
  targets: [
    {
      path: 'src/surf.ts',
      content: 'export const surf = () => {\n  return 1;\n};\n',
      diff: '@@ -1,3 +1,3 @@\n export const surf = () => {\n-  console.log(1);\n+  return 1;\n };',
      changeKind: 'edited',
    },
    {
      path: 'src/wave.ts',
      content: 'export const wave = () => 2;\n',
      diff: '+export const wave = () => 2;',
      changeKind: 'new',
    },
    {
      path: 'src/tide.ts',
      content: null,
      diff: '-export const tide = 3;',
      changeKind: 'deleted',
    },
  ],
  focus: 'push',
  goal: 'exhaustive',
  contextWindowSize: 200_000,
  costSpec: {
    per: 'token',
    input: asIsoPrice('$0.0000001'),
    output: asIsoPrice('$0.0000003'),
    cache: {
      set: asIsoPrice('$0.00000025'),
      get: asIsoPrice('$0.000000025'),
    },
  },
  diffRange: 'origin/main',
};

/**
 * .what = the layout fixtures, by name — a whole run, and one partition of a split
 * .why = the two layouts part differently: a whole run holds one target band, a partition
 *        splits its targets into the band every partition carries and its own
 */
export const genReviewPromptLayoutInput = (input: {
  of: 'whole' | 'partition';
}): Parameters<typeof compileReviewPrompt>[0] => {
  if (input.of === 'whole') return INPUT_OF_WHOLE_RUN;
  return {
    ...INPUT_OF_WHOLE_RUN,
    targetsShared: ['src/wave.ts'],
    targetsAsContext: ['src/wave.ts'],
    partitionPeers: [{ name: 'tide', globs: ['src/tide*'] }],
  };
};
