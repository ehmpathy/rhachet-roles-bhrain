import { given, then, when } from 'test-fns';

import { getRouteReminderDaemonSpawnPlan } from './getRouteReminderDaemonSpawnPlan';

describe('getRouteReminderDaemonSpawnPlan', () => {
  given('a node path + route + clone-addr + interval + say-timeout', () => {
    when('[t0] the spawn plan is built', () => {
      const plan = getRouteReminderDaemonSpawnPlan({
        nodePath: '/usr/bin/node',
        route: '.behavior/my-feature',
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
        expect(plan.args[1]).toContain('routeReminderDaemon()');
      });

      then('the daemon args follow the posix -- marker', () => {
        expect(plan.args).toEqual([
          '-e',
          "import('rhachet-roles-bhrain/cli/route.reminder').then(m => m.routeReminderDaemon())",
          '--',
          '--route',
          '.behavior/my-feature',
          '--clone-addr',
          '@:driver-1',
          '--interval-ms',
          '1200000',
          '--say-timeout-ms',
          '30000',
        ]);
      });
    });
  });
});
