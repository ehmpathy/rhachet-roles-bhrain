import { getAllBashTeeOperands } from './getAllBashTeeOperands';

const TEST_CASES: Array<{
  description: string;
  segment: string;
  expect: string[] | null;
}> = [
  { description: 'one operand', segment: 'tee a.md', expect: ['a.md'] },
  {
    description: 'options are not operands',
    segment: 'tee -a --ignore-interrupts a.md b.md',
    expect: ['a.md', 'b.md'],
  },
  {
    description: 'an operand after an attached redirect still counts',
    segment: 'tee a.md 2>/dev/null M/x.md',
    expect: ['a.md', 'M/x.md'],
  },
  {
    description: 'an operand after a detached redirect still counts',
    segment: 'tee a.md > /dev/null M/x.md',
    expect: ['a.md', 'M/x.md'],
  },
  {
    description: 'an fd duplicate is skipped',
    segment: 'tee /tmp/a 2>&1 M/x.md',
    expect: ['/tmp/a', 'M/x.md'],
  },
  {
    description: 'a path-named tee is a tee',
    segment: '/usr/bin/tee /tmp/out.md',
    expect: ['/tmp/out.md'],
  },
  {
    description: 'an escaped tee is a tee',
    segment: '\\tee /tmp/out.md',
    expect: ['/tmp/out.md'],
  },
  {
    description: 'a quoted tee is a tee',
    segment: '"tee" /tmp/out.md',
    expect: ['/tmp/out.md'],
  },
  { description: 'no tee', segment: 'cat a.md', expect: null },
  { description: 'no operand', segment: 'tee', expect: null },
  { description: 'xargs appends operands', segment: 'xargs tee', expect: null },
  {
    description: 'a non-plain operand',
    segment: 'tee {} $F',
    expect: null,
  },
];

describe('getAllBashTeeOperands', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getAllBashTeeOperands({ segment: thisCase.segment })).toEqual(
        thisCase.expect,
      );
    }),
  );
});
