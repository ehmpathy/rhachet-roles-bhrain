import { given, then, when } from 'test-fns';

import { getRouteReminderDaemonSpawnPlan } from './getRouteReminderDaemonSpawnPlan';

describe('getRouteReminderDaemonSpawnPlan', () => {
  given('a node path + repo root + clone-addr + interval + say-timeout', () => {
    when('[t0] the spawn plan is built', () => {
      const plan = getRouteReminderDaemonSpawnPlan({
        nodePath: '/usr/bin/node',
        repoRoot: '/tmp/repo-x',
        cloneAddr: '@:driver-1',
        intervalMs: 1200000,
        sayTimeoutMs: 30000,
      });

      then('the command is the node binary', () => {
        expect(plan.command).toBe('/usr/bin/node');
      });

      then('it evals the isolated route.reminder cli subpath', () => {
        expect(plan.args[0]).toBe('-e');
        expect(plan.args[1]).toContain(
          "import('rhachet-roles-bhrain/cli/route.reminder')",
        );
        expect(plan.args[1]).toContain("routeReminderCli({ verb: 'daemon' })");
      });

      then('the daemon args follow the posix -- marker', () => {
        expect(plan.args).toEqual([
          '-e',
          "import('rhachet-roles-bhrain/cli/route.reminder').then(m => m.routeReminderCli({ verb: 'daemon' }))",
          '--',
          '--repo-root',
          '/tmp/repo-x',
          '--clone-addr',
          '@:driver-1',
          '--interval-ms',
          '1200000',
          '--say-timeout-ms',
          '30000',
        ]);
      });

      then(
        'the daemon carries no --route: it reads its route from the focus',
        () => {
          expect(plan.args).not.toContain('--route');
        },
      );
    });
  });
});
