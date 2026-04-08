import {
  Goal,
  GoalHow,
  GoalStatus,
  type GoalStatusChoice,
  GoalWhat,
  GoalWhy,
} from '@src/domain.objects/Achiever/Goal';

/**
 * .what = creates a Goal fixture with sensible defaults
 * .why = eliminates manual YAML construction in tests
 */
export const createGoalFixture = (
  overrides: Partial<{
    slug: string;
    why: Partial<{ ask: string; purpose: string; benefit: string }>;
    what: Partial<{ outcome: string }>;
    how: Partial<{ task: string; gate: string }>;
    status: Partial<{ choice: GoalStatusChoice; reason: string }>;
    source: Goal['source'];
    createdAt: string;
    updatedAt: string;
  }> = {},
): Goal => {
  const now = new Date().toISOString().split('T')[0] as string;

  const why = new GoalWhy({
    ask: overrides.why?.ask ?? 'test ask',
    purpose: overrides.why?.purpose ?? 'test purpose',
    benefit: overrides.why?.benefit ?? 'test benefit',
  });
  const what = new GoalWhat({
    outcome: overrides.what?.outcome ?? 'test outcome',
  });
  const how = new GoalHow({
    task: overrides.how?.task ?? 'test task',
    gate: overrides.how?.gate ?? 'test gate',
  });

  return new Goal({
    slug: overrides.slug ?? 'test-goal',
    why,
    what,
    how,
    status: new GoalStatus({
      choice: overrides.status?.choice ?? 'enqueued',
      reason: overrides.status?.reason ?? 'test reason',
    }),
    source: overrides.source ?? 'peer:human',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  });
};
