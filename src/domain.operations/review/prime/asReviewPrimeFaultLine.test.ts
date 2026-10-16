import { asReviewPrimeFaultLine } from './asReviewPrimeFaultLine';

const TEST_CASES: {
  description: string;
  given: Parameters<typeof asReviewPrimeFaultLine>[0];
  expect: { output: string };
}[] = [
  {
    description: 'a store fault names the watermark and pours this lane cold',
    given: { kind: 'store', cause: 'EACCES' },
    expect: {
      output:
        '💥 MalfunctionError: the prime watermark could not be read or written (EACCES); this lane pours cold',
    },
  },
  {
    description: 'a release fault names its peers, cold at their deadline',
    given: { kind: 'release', cause: 'ENOSPC' },
    expect: {
      output:
        '💥 MalfunctionError: the prime release could not be written (ENOSPC); its peer lanes pour cold at their deadline',
    },
  },
  {
    description:
      'a poke fault of a meet names the shared prefix and its peer lanes',
    given: {
      kind: 'poke',
      cause: 'BrainCallError: 529 overloaded',
      peers: 'lanes',
    },
    expect: {
      output:
        '💥 MalfunctionError: the prime of the shared prefix failed (BrainCallError: 529 overloaded); its peer lanes pour cold',
    },
  },
  {
    description:
      'a poke fault of a split lane renders in the same sentence, its partitions named',
    given: {
      kind: 'poke',
      cause: 'the brain call failed — terminated',
      peers: 'partitions',
    },
    expect: {
      output:
        '💥 MalfunctionError: the prime of the shared prefix failed (the brain call failed — terminated); its peer partitions pour cold',
    },
  },
  {
    description:
      'a poke that outlasts the meet deadline names the wait it was given',
    given: { kind: 'deadline', msOfWait: 3000 },
    expect: {
      output:
        "💥 MalfunctionError: the prime of the shared prefix outlasted the 3000ms this lane's deadline left the meet; its peer lanes pour cold",
    },
  },
  {
    description: 'a timeout names the class the system must clear',
    given: { kind: 'timeout', msOfAwait: 130000 },
    expect: {
      output:
        '💥 MalfunctionError: the prime of the shared head was not released within 130000ms; this lane pours cold',
    },
  },
];

describe('asReviewPrimeFaultLine', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asReviewPrimeFaultLine(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
