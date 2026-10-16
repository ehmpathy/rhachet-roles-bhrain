import { asIsoPrice } from 'iso-price';
import { given, then } from 'test-fns';

import { asCostColumnHuman } from './asCostColumnHuman';

/**
 * .what = every metered spend in a cost column renders at the same six-digit grain,
 *         and only a nil keeps the short `$0`
 * .why = a whole-dollar amount once dropped its fraction (`$1`), so it read in the
 *        short shape of a refused nil (`$0`) and broke the column's alignment
 */
const TEST_CASES = [
  {
    description: 'a fraction of a cent keeps its micro digits',
    given: { cost: asIsoPrice('USD 0.00142') },
    expect: { output: '$0.001420' },
  },
  {
    description: 'a whole dollar keeps six fraction digits',
    given: { cost: asIsoPrice('USD 1') },
    expect: { output: '$1.000000' },
  },
  {
    description:
      'a nil keeps the short `$0` — a fact, refused or metered at zero; the grade column parts the two',
    given: { cost: asIsoPrice('USD 0') },
    expect: { output: '$0' },
  },
  {
    description: 'a dollar and a quarter keeps six fraction digits',
    given: { cost: asIsoPrice('USD 1.25') },
    expect: { output: '$1.250000' },
  },
];

describe('asCostColumnHuman', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then(`renders ${thisCase.expect.output}`, () => {
        expect(asCostColumnHuman({ cost: thisCase.given.cost })).toEqual(
          thisCase.expect.output,
        );
      });
    }),
  );
});
