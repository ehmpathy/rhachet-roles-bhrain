import { asTemplateFilled } from './asTemplateFilled';

const TEST_CASES: Array<{
  description: string;
  given: { template: string; vars: Record<string, string> };
  expect: string;
}> = [
  {
    description: 'fills each named var',
    given: {
      template: 'course $COURSE_SLUG for $ROLE',
      vars: { COURSE_SLUG: 'idempotency', ROLE: 'mechanic' },
    },
    expect: 'course idempotency for mechanic',
  },
  {
    description:
      'fills the longer of two names that share a prefix, never the shorter',
    given: {
      template: '$ROLE · $ROLE_KIND',
      vars: { ROLE: 'mechanic', ROLE_KIND: 'own' },
    },
    expect: 'mechanic · own',
  },
  {
    description: 'keeps a runtime $route a guard expands later',
    given: { template: 'rhx judge --route $route', vars: { ROUTE: 'x' } },
    expect: 'rhx judge --route $route',
  },
  {
    description: 'keeps an upper name absent from vars',
    given: { template: '$UNKNOWN stays', vars: {} },
    expect: '$UNKNOWN stays',
  },
];

describe('asTemplateFilled', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asTemplateFilled(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
