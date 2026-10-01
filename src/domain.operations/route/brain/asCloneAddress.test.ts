import { asCloneAddress } from './asCloneAddress';

/**
 * .what = pins which `clone whoami` payloads yield an address, and which yield null
 * .why = this is a pure transformer, so `rule.require.test-coverage-by-grain` puts it
 *        at the UNIT grain — and `rule.prefer.data-driven` names this exact shape:
 *        a caselist is preferred "especially unit tests of transformers"
 *
 * 🔴 .why the NON-STRING rows exist = `rule.require.clamp-edge-cases` asks for the
 *    CLASS, never the one input that happened to be tried. the defect was a bare
 *    `parsed.slug ?? parsed.serial`, which reads through `JSON.parse`'s `any` and so
 *    admits every row below — each would have been returned through a `string | null`
 *    signature, and `@:[object Object]` would then be addressed as a confirmed clone
 *
 * .note = the boundary is REAL, not hypothetical. rhachet owns this payload and ships
 *         it on its own release cadence, so its shape is not a guarantee this repo can
 *         keep. that is what parts this read from `getGoalBlockerState.ts:17-20`, which
 *         parses with no narrow because it reads a file THIS repo wrote
 */
const TEST_CASES: {
  description: string;
  given: { payload: unknown };
  expect: { address: string | null };
}[] = [
  // the two rows that carry the happy path
  {
    description: 'takes the slug when it is a non-empty string',
    given: {
      payload: { slug: 'driver', serial: '88412066-abcd', reach: 'LIVE' },
    },
    expect: { address: 'driver' },
  },
  {
    description: 'falls back to the serial when the slug is null',
    given: { payload: { slug: null, serial: '88412066-abcd', reach: 'LIVE' } },
    expect: { address: '88412066-abcd' },
  },

  // the empty-value class, on both fields
  {
    description: 'refuses an empty slug, and falls through to the serial',
    given: { payload: { slug: '', serial: '88412066-abcd' } },
    expect: { address: '88412066-abcd' },
  },
  {
    description: 'refuses an empty serial, and reports no address',
    given: { payload: { slug: null, serial: '' } },
    expect: { address: null },
  },
  // the WHITESPACE-ONLY rows — `'   '.length > 0` is true, so `@:   ` would read as a
  //    confirmed clone. the contract is shape-EXACTNESS, so every shape gets a row
  {
    description: 'refuses a whitespace-only slug, and falls to the serial',
    given: { payload: { slug: '   ', serial: '88412066-abcd' } },
    expect: { address: '88412066-abcd' },
  },
  {
    description: 'refuses a whitespace-only serial, and reports no address',
    given: { payload: { slug: null, serial: ' \t ' } },
    expect: { address: null },
  },
  {
    description: 'trims a padded address rather than address `@: driver `',
    given: { payload: { slug: ' driver ', serial: null } },
    expect: { address: 'driver' },
  },

  // the non-string class — the defect this transformer was extracted to close
  {
    description: 'refuses a numeric slug, and falls through to the serial',
    given: { payload: { slug: 42, serial: '88412066-abcd' } },
    expect: { address: '88412066-abcd' },
  },
  {
    description:
      'refuses an object slug — it would address `@:[object Object]`',
    given: { payload: { slug: { name: 'driver' }, serial: null } },
    expect: { address: null },
  },
  {
    description: 'refuses a boolean serial',
    given: { payload: { slug: null, serial: true } },
    expect: { address: null },
  },
  {
    description: 'refuses an array serial',
    given: { payload: { slug: null, serial: ['88412066-abcd'] } },
    expect: { address: null },
  },

  // the absent-field class
  {
    description: 'reports no address when both fields are absent',
    given: { payload: { reach: 'LIVE' } },
    expect: { address: null },
  },
  {
    description: 'reports no address for an empty object',
    given: { payload: {} },
    expect: { address: null },
  },

  // the non-object class — `JSON.parse` admits each of these as a valid document
  {
    description: 'reports no address for a bare number document',
    given: { payload: 42 },
    expect: { address: null },
  },
  {
    description: 'reports no address for a bare string document',
    given: { payload: 'driver' },
    expect: { address: null },
  },
  {
    description: 'reports no address for a null document',
    given: { payload: null },
    expect: { address: null },
  },
  {
    description: 'reports no address for an array document',
    given: { payload: [{ slug: 'driver' }] },
    expect: { address: null },
  },
];

describe('asCloneAddress', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const address = asCloneAddress({ payload: thisCase.given.payload });
      expect(address).toEqual(thisCase.expect.address);
    }),
  );
});
