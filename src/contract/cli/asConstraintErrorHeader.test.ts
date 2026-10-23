import { BadRequestError, ConstraintError } from 'helpful-errors';

import { asConstraintErrorHeader } from './asConstraintErrorHeader';

const TEST_CASES: Array<{
  description: string;
  given: { error: Parameters<typeof asConstraintErrorHeader>[0]['error'] };
  expect: { output: string };
}> = [
  {
    description: 'qualifies a bare refusal under the constraint header',
    given: { error: new BadRequestError('rubric not found: ghost') },
    expect: { output: '✋ ConstraintError: rubric not found: ghost' },
  },
  {
    description:
      '🔴 clamp. keeps the metadata bag, one compact line per field, beneath the headline',
    given: {
      error: new BadRequestError<NonNullable<BadRequestError['metadata']>>(
        'guard is blocked',
        { blocked: ['9.broken.guard'] },
      ),
    },
    expect: {
      output:
        '✋ ConstraintError: guard is blocked\n\nblocked: ["9.broken.guard"]',
    },
  },
  {
    description:
      '🔴 clamp. a ConstraintError keeps its bag too, never only the hint',
    given: {
      error: new ConstraintError('role not found', {
        role: 'ghost',
        roles: { known: ['mechanic'] },
      }),
    },
    expect: {
      output:
        '✋ ConstraintError: role not found\n\nrole: ghost\nroles: {"known":["mechanic"]}',
    },
  },
  {
    description: 'closes with the bag hint as its own labelled line',
    given: {
      error: new BadRequestError<NonNullable<BadRequestError['metadata']>>(
        'role not found',
        { role: 'ghost', hint: 'run rhx enroll --roles mechanic' },
      ),
    },
    expect: {
      output:
        '✋ ConstraintError: role not found\n\nrole: ghost\n\nhint: run rhx enroll --roles mechanic',
    },
  },
  {
    description:
      '🔴 clamp. the bag sits directly under the first line, above the body example, and the hint still closes the block',
    given: {
      error: new BadRequestError<NonNullable<BadRequestError['metadata']>>(
        'route not found: tpyo\n\nname a route that exists, e.g.:\n  --route .behavior/v2026_10_13.demo',
        { routeAbs: '/repo/tpyo', hint: 'run rhx route.bind.get' },
      ),
    },
    expect: {
      output:
        '✋ ConstraintError: route not found: tpyo\n\nrouteAbs: /repo/tpyo\n\nname a route that exists, e.g.:\n  --route .behavior/v2026_10_13.demo\n\nhint: run rhx route.bind.get',
    },
  },
  {
    description: 'renders a multi-line message with no bag as written',
    given: {
      error: new BadRequestError(
        '--what is required for --as inflight\n\nname the work you wait on, e.g.:\n  --as inflight --what x',
      ),
    },
    expect: {
      output:
        '✋ ConstraintError: --what is required for --as inflight\n\nname the work you wait on, e.g.:\n  --as inflight --what x',
    },
  },
  {
    description: 'leaves a class word inside the body as written',
    given: {
      error: new BadRequestError('a BadRequestError: was named in the body'),
    },
    expect: {
      output: '✋ ConstraintError: a BadRequestError: was named in the body',
    },
  },
  {
    description:
      'still names the class where the message lacks the BadRequestError lead',
    given: {
      // a message with no class lead, as another helpful-errors shape could carry
      error: Object.assign(new BadRequestError('placeholder'), {
        message: 'no latest map is known for brain provider',
      }),
    },
    expect: {
      output: '✋ ConstraintError: no latest map is known for brain provider',
    },
  },
  {
    description:
      'never doubles the header for a ConstraintError, which writes its own lead',
    given: { error: new ConstraintError('brain is not registered') },
    expect: { output: '✋ ConstraintError: brain is not registered' },
  },
];

describe('asConstraintErrorHeader', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asConstraintErrorHeader({ error: thisCase.given.error })).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
