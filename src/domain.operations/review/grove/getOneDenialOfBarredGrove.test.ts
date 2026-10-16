import type { ReviewTreeRead } from './asTreeReadsSplit';
import { getOneDenialOfBarredGrove } from './getOneDenialOfBarredGrove';

const asTree = (name: string) => ({
  name,
  dir: `/grove/${name}`,
  root: `/grove/${name}/.log/bhrain/review`,
  present: true,
});

const denialOfBeta = new Error('EACCES: beta');
const denialOfDelta = new Error('EACCES: delta');

const readHealthy: ReviewTreeRead = {
  tree: asTree('alpha'),
  read: { runs: [], fault: null, denial: null },
};
const readDeniedBeta: ReviewTreeRead = {
  tree: asTree('beta'),
  read: { runs: [], fault: String(denialOfBeta), denial: denialOfBeta },
};
const readVanished: ReviewTreeRead = {
  tree: asTree('gamma'),
  read: { runs: [], fault: 'the log root vanished', denial: null },
};
const readDeniedDelta: ReviewTreeRead = {
  tree: asTree('delta'),
  read: { runs: [], fault: String(denialOfDelta), denial: denialOfDelta },
};

const TEST_CASES: {
  description: string;
  given: Parameters<typeof getOneDenialOfBarredGrove>[0];
  expect: ReturnType<typeof getOneDenialOfBarredGrove>;
}[] = [
  {
    description: 'no reads → no refusal owed',
    given: { reads: [], readableCount: 0 },
    expect: null,
  },
  {
    description: 'a tree still prices → no refusal, even beside a denial',
    given: { reads: [readHealthy, readDeniedBeta], readableCount: 1 },
    expect: null,
  },
  {
    description: 'no tree metered and none denied (only vanished) → no refusal',
    given: { reads: [readVanished], readableCount: 0 },
    expect: null,
  },
  {
    description:
      'no tree metered and some denied → the FIRST denial, in tree order',
    given: {
      reads: [readVanished, readDeniedBeta, readDeniedDelta],
      readableCount: 0,
    },
    expect: { denial: denialOfBeta },
  },
];

describe('getOneDenialOfBarredGrove', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOneDenialOfBarredGrove(thisCase.given)).toEqual(
        thisCase.expect,
      );
    }),
  );
});
