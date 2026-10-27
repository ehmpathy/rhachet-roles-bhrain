import { asIsoPrice } from 'iso-price';

import type { TokenCategory } from '@src/domain.objects/Reflector/TokenBlock';
import type { TokenSpendRepaidRow } from '@src/domain.objects/Reflector/TokenSpendReport';

import { asTokenProposal } from './asTokenProposal';

/**
 * .what = a repaid row of a category and label, priced at a given figure
 */
const genRow = (input: {
  category: TokenCategory;
  label: string;
  price: string;
}): TokenSpendRepaidRow => {
  const price = asIsoPrice(input.price);
  return {
    category: input.category,
    label: input.label,
    tokens: { cacheRead: 1_000, cacheWrite5m: 0, cacheWrite1h: 0, input: 0 },
    priced: {
      price,
      unpricedTokens: 0,
      byKind: {
        input: null,
        output: null,
        cacheRead: price,
        cacheWrite5m: null,
        cacheWrite1h: null,
      },
    },
    peak: null,
  };
};

const TEST_CASES = [
  {
    description:
      'two tool results under one category → each gets its own tool hint',
    given: {
      repaid: [
        genRow({
          category: 'tool.result',
          label: 'Bash · git.repo.test',
          price: 'USD 0.30',
        }),
        genRow({ category: 'tool.result', label: 'Read', price: 'USD 0.20' }),
      ],
    },
    expect: {
      hints: ['a summary on stdout, the log on disk', 'read by range'],
    },
  },
  {
    description: 'a tool with no hint of its own → its category hint',
    given: {
      repaid: [
        genRow({ category: 'tool.result', label: 'Edit', price: 'USD 0.10' }),
      ],
    },
    expect: { hints: ['a summary on stdout, the log on disk'] },
  },
  {
    description: 'a row outside tool.result → its category hint',
    given: {
      repaid: [
        genRow({
          category: 'boot.instructions',
          label: 'Read',
          price: 'USD 0.10',
        }),
      ],
    },
    expect: { hints: ['move briefs from say to ref'] },
  },
] as const;

describe('asTokenProposal', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const { targets } = asTokenProposal({
        repaid: [...thisCase.given.repaid],
        limit: 3,
      });
      expect(targets.map((target) => target.hint)).toEqual(
        thisCase.expect.hints,
      );
    }),
  );
});
