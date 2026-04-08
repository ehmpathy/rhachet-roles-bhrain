import { given, then, when } from 'test-fns';

import {
  computeGoalCompleteness,
  GOAL_REQUIRED_FIELDS,
  Goal,
  GoalHow,
  GoalMeta,
  GoalStatus,
  GoalWhat,
  GoalWhen,
  GoalWhy,
} from './Goal';

describe('Goal', () => {
  given('[case1] a valid goal with all required fields', () => {
    when('[t0] instantiated', () => {
      then('it should create the goal', () => {
        const goal = new Goal({
          slug: 'fix-auth-test',
          why: new GoalWhy({
            ask: 'fix the flaky test in auth.test.ts',
            purpose: 'human wants ci to pass before merge',
            benefit: 'unblocks the pr, team can ship',
          }),
          what: new GoalWhat({
            outcome: 'auth.test.ts passes reliably',
          }),
          how: new GoalHow({
            task: 'run test in isolation, identify flake source, apply fix',
            gate: 'test passes 10 consecutive runs',
          }),
          status: new GoalStatus({
            choice: 'enqueued',
            reason: 'goal created from triage',
          }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        expect(goal.slug).toEqual('fix-auth-test');
        expect(goal.why?.ask).toEqual('fix the flaky test in auth.test.ts');
        expect(goal.why?.purpose).toEqual(
          'human wants ci to pass before merge',
        );
        expect(goal.why?.benefit).toEqual('unblocks the pr, team can ship');
        expect(goal.what?.outcome).toEqual('auth.test.ts passes reliably');
        expect(goal.how?.task).toEqual(
          'run test in isolation, identify flake source, apply fix',
        );
        expect(goal.how?.gate).toEqual('test passes 10 consecutive runs');
        expect(goal.status.choice).toEqual('enqueued');
        expect(goal.status.reason).toEqual('goal created from triage');
        expect(goal.source).toEqual('peer:human');
        expect(goal.when).toBeUndefined();
      });
    });
  });

  given('[case2] a blocked goal with when.goal', () => {
    when('[t0] instantiated', () => {
      then('it should create the goal with blocker dependency', () => {
        const goal = new Goal({
          slug: 'write-tests',
          why: new GoalWhy({
            ask: 'write tests for the new feature',
            purpose: 'ensure code quality before merge',
            benefit: 'prevents regressions',
          }),
          what: new GoalWhat({
            outcome: 'feature has comprehensive test coverage',
          }),
          how: new GoalHow({
            task: 'write unit and integration tests',
            gate: 'coverage > 80%',
          }),
          status: new GoalStatus({
            choice: 'blocked',
            reason: 'awaits feature implementation',
          }),
          when: new GoalWhen({
            goal: 'implement-feature',
          }) as Goal['when'],
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        expect(goal.status.choice).toEqual('blocked');
        expect(goal.when?.goal).toEqual('implement-feature');
        expect(goal.when?.event).toBeUndefined();
      });
    });
  });

  given('[case3] a blocked goal with when.event', () => {
    when('[t0] instantiated', () => {
      then('it should create the goal with external blocker', () => {
        const goal = new Goal({
          slug: 'deploy-to-prod',
          why: new GoalWhy({
            ask: 'deploy the fix to production',
            purpose: 'users need the bug fix',
            benefit: 'users stop encountering the issue',
          }),
          what: new GoalWhat({
            outcome: 'fix is live in production',
          }),
          how: new GoalHow({
            task: 'run deployment pipeline',
            gate: 'health checks pass post-deploy',
          }),
          status: new GoalStatus({
            choice: 'blocked',
            reason: 'deploy window is Tuesday',
          }),
          when: new GoalWhen({
            event: 'Tuesday deploy window opens',
          }) as Goal['when'],
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        expect(goal.status.choice).toEqual('blocked');
        expect(goal.when?.event).toEqual('Tuesday deploy window opens');
        expect(goal.when?.goal).toBeUndefined();
      });
    });
  });

  given('[case4] a fulfilled goal', () => {
    when('[t0] instantiated', () => {
      then('it should create the goal with verification evidence', () => {
        const goal = new Goal({
          slug: 'fix-auth-test',
          why: new GoalWhy({
            ask: 'fix the flaky test',
            purpose: 'ci needs to pass',
            benefit: 'team can ship',
          }),
          what: new GoalWhat({
            outcome: 'auth.test.ts passes reliably',
          }),
          how: new GoalHow({
            task: 'stabilize mock time',
            gate: 'test passes 10 consecutive runs',
          }),
          status: new GoalStatus({
            choice: 'fulfilled',
            reason: 'test passes 10 consecutive runs after mock stabilized',
          }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        expect(goal.status.choice).toEqual('fulfilled');
        expect(goal.status.reason).toContain('10 consecutive runs');
      });
    });
  });

  given('[case5] a self-generated goal', () => {
    when('[t0] instantiated', () => {
      then('it should have source=self', () => {
        const goal = new Goal({
          slug: 'update-changelog',
          why: new GoalWhy({
            ask: 'noticed changelog needs update',
            purpose: 'users should know what changed',
            benefit: 'better communication of changes',
          }),
          what: new GoalWhat({
            outcome: 'changelog reflects recent changes',
          }),
          how: new GoalHow({
            task: 'add entry for the fix',
            gate: 'changelog contains fix entry',
          }),
          status: new GoalStatus({
            choice: 'enqueued',
            reason: 'self-observed while at work',
          }),
          source: 'self',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        expect(goal.source).toEqual('self');
      });
    });
  });

  given('[case6] serialization', () => {
    when('[t0] JSON serialized', () => {
      then('it should produce valid JSON with nested objects', () => {
        const goal = new Goal({
          slug: 'fix-auth-test',
          why: new GoalWhy({
            ask: 'fix the test',
            purpose: 'ci pass',
            benefit: 'ship',
          }),
          what: new GoalWhat({
            outcome: 'test passes',
          }),
          how: new GoalHow({
            task: 'fix it',
            gate: 'test passes',
          }),
          status: new GoalStatus({
            choice: 'enqueued',
            reason: 'new goal',
          }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        const json = JSON.stringify(goal);
        const parsed = JSON.parse(json);

        expect(parsed.slug).toEqual('fix-auth-test');
        expect(parsed.why.ask).toEqual('fix the test');
        expect(parsed.what.outcome).toEqual('test passes');
        expect(parsed.how.task).toEqual('fix it');
        expect(parsed.status.choice).toEqual('enqueued');
      });
    });
  });

  given('[case7] all status choices', () => {
    when('[t0] instantiated with each choice', () => {
      then('blocked should be valid', () => {
        const status = new GoalStatus({ choice: 'blocked', reason: 'test' });
        expect(status.choice).toEqual('blocked');
      });

      then('enqueued should be valid', () => {
        const status = new GoalStatus({ choice: 'enqueued', reason: 'test' });
        expect(status.choice).toEqual('enqueued');
      });

      then('inflight should be valid', () => {
        const status = new GoalStatus({ choice: 'inflight', reason: 'test' });
        expect(status.choice).toEqual('inflight');
      });

      then('fulfilled should be valid', () => {
        const status = new GoalStatus({ choice: 'fulfilled', reason: 'test' });
        expect(status.choice).toEqual('fulfilled');
      });
    });
  });

  given('[case8] all source types', () => {
    when('[t0] instantiated with each source', () => {
      const baseGoal = {
        slug: 'test',
        why: new GoalWhy({ ask: 'a', purpose: 'b', benefit: 'c' }),
        what: new GoalWhat({ outcome: 'd' }),
        how: new GoalHow({ task: 'e', gate: 'f' }),
        status: new GoalStatus({ choice: 'enqueued' as const, reason: 'g' }),
        createdAt: '2026-04-02',
        updatedAt: '2026-04-02',
      };

      then('peer:human should be valid', () => {
        const goal = new Goal({ ...baseGoal, source: 'peer:human' });
        expect(goal.source).toEqual('peer:human');
      });

      then('peer:robot should be valid', () => {
        const goal = new Goal({ ...baseGoal, source: 'peer:robot' });
        expect(goal.source).toEqual('peer:robot');
      });

      then('self should be valid', () => {
        const goal = new Goal({ ...baseGoal, source: 'self' });
        expect(goal.source).toEqual('self');
      });
    });
  });

  given('[case9] computeGoalCompleteness with full goal', () => {
    when('[t0] all required fields present', () => {
      then('meta.complete should be true', () => {
        const meta = computeGoalCompleteness({
          why: { ask: 'fix it', purpose: 'ci pass', benefit: 'ship' },
          what: { outcome: 'test passes' },
          how: { task: 'do it', gate: 'verify' },
        });

        expect(meta.complete).toBe(true);
        expect(meta.absent).toEqual([]);
      });
    });
  });

  given(
    '[case10] computeGoalCompleteness with partial goal (slug only)',
    () => {
      when('[t0] no why/what/how provided', () => {
        then(
          'meta.complete should be false and absent should list all fields',
          () => {
            const meta = computeGoalCompleteness({});

            expect(meta.complete).toBe(false);
            expect(meta.absent).toContain('why.ask');
            expect(meta.absent).toContain('why.purpose');
            expect(meta.absent).toContain('why.benefit');
            expect(meta.absent).toContain('what.outcome');
            expect(meta.absent).toContain('how.task');
            expect(meta.absent).toContain('how.gate');
            expect(meta.absent).toHaveLength(GOAL_REQUIRED_FIELDS.length);
          },
        );
      });
    },
  );

  given('[case11] computeGoalCompleteness with partial why only', () => {
    when('[t0] only why.ask provided', () => {
      then('meta.absent should exclude why.ask', () => {
        const meta = computeGoalCompleteness({
          why: { ask: 'fix it' },
        });

        expect(meta.complete).toBe(false);
        expect(meta.absent).not.toContain('why.ask');
        expect(meta.absent).toContain('why.purpose');
        expect(meta.absent).toContain('why.benefit');
        expect(meta.absent).toContain('what.outcome');
        expect(meta.absent).toContain('how.task');
        expect(meta.absent).toContain('how.gate');
      });
    });
  });

  given('[case12] partial goal instantiation', () => {
    when('[t0] only slug and status provided', () => {
      then('computeGoalCompleteness should return complete = false', () => {
        const goal = new Goal({
          slug: 'quick-capture',
          status: new GoalStatus({
            choice: 'enqueued',
            reason: 'captured quickly',
          }),
          source: 'peer:human',
          createdAt: '2026-04-04',
          updatedAt: '2026-04-04',
        });

        expect(goal.slug).toEqual('quick-capture');
        expect(goal.why).toBeUndefined();
        expect(goal.what).toBeUndefined();
        expect(goal.how).toBeUndefined();

        const meta = computeGoalCompleteness(goal);
        expect(meta.complete).toBe(false);
        expect(meta.absent).toHaveLength(6);
      });
    });
  });

  given('[case13] partial goal with some fields', () => {
    when('[t0] slug, why.ask, and what.outcome provided', () => {
      then(
        'computeGoalCompleteness should track which fields are absent',
        () => {
          const goal = new Goal({
            slug: 'partial-articulated',
            why: new GoalWhy({ ask: 'fix the test', purpose: '', benefit: '' }),
            what: new GoalWhat({ outcome: 'test passes' }),
            status: new GoalStatus({
              choice: 'enqueued',
              reason: 'in progress articulation',
            }),
            source: 'peer:human',
            createdAt: '2026-04-04',
            updatedAt: '2026-04-04',
          });

          const meta = computeGoalCompleteness(goal);
          expect(meta.complete).toBe(false);
          expect(meta.absent).toContain('why.purpose');
          expect(meta.absent).toContain('why.benefit');
          expect(meta.absent).toContain('how.task');
          expect(meta.absent).toContain('how.gate');
          expect(meta.absent).not.toContain('why.ask');
          expect(meta.absent).not.toContain('what.outcome');
        },
      );
    });
  });

  given('[case14] GoalMeta domain object', () => {
    when('[t0] instantiated', () => {
      then('it should hold completeness state', () => {
        const meta = new GoalMeta({
          complete: false,
          absent: ['why.purpose', 'how.gate'],
        });

        expect(meta.complete).toBe(false);
        expect(meta.absent).toEqual(['why.purpose', 'how.gate']);
      });
    });
  });
});
