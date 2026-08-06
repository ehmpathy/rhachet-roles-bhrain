import type { ExitCodeClass } from '../getExitCodeClass';
import { isJudgeRungHeld } from './isJudgeRungHeld';

const CASES: {
  description: string;
  given: { iteration: number; exitClass: ExitCodeClass }[];
  expect: boolean;
}[] = [
  {
    description: 'no judge verdict = the judge has not run = not held',
    given: [],
    expect: false,
  },
  {
    description: 'latest judge passed = not held',
    given: [{ iteration: 1, exitClass: 'passed' }],
    expect: false,
  },
  {
    description: 'latest judge malfunctioned = held',
    given: [{ iteration: 1, exitClass: 'malfunction' }],
    expect: true,
  },
  {
    description:
      'latest judge constraint (e.g. approved? awaits sign-off) = not held',
    given: [{ iteration: 1, exitClass: 'constraint' }],
    expect: false,
  },
  {
    description: 'a prior malfunction cleared by a later pass = not held',
    given: [
      { iteration: 1, exitClass: 'malfunction' },
      { iteration: 2, exitClass: 'passed' },
    ],
    expect: false,
  },
  {
    description: 'a prior pass then a later malfunction = held',
    given: [
      { iteration: 1, exitClass: 'passed' },
      { iteration: 2, exitClass: 'malfunction' },
    ],
    expect: true,
  },
  {
    description: 'any judge at the latest iteration that malfunctions = held',
    given: [
      { iteration: 2, exitClass: 'passed' },
      { iteration: 2, exitClass: 'malfunction' },
    ],
    expect: true,
  },
];

describe('isJudgeRungHeld', () => {
  CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const held = isJudgeRungHeld({ judges: thisCase.given });
      expect(held).toEqual(thisCase.expect);
    }),
  );
});
