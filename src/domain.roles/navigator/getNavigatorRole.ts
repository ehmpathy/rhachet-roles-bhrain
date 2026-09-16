import { Role } from 'rhachet';

/**
 * .what = navigator role definition
 * .why = boots a route where none exists, so offroad work leaves pavement behind
 *        instead of a finished task and a cold trail
 *
 * .note = the seam with the driver: the navigator PLANS a route and binds it; the
 *         driver WALKS one. neither does the other's half.
 */
export const ROLE_NAVIGATOR: Role = Role.build({
  slug: 'navigator',
  name: 'Navigator',
  purpose: 'boot and bind offroad routes, so exploration leaves pavement behind',
  readme: { uri: __dirname + '/readme.md' },
  boot: { uri: __dirname + '/boot.yml' },
  traits: [],
  // .note = an EMPTY skills registry on purpose. the navigator plans a route; the DRIVER
  //         walks it, so the capacities it reaches for are the driver's route.* skills.
  //         a dir here would hold only a .gitkeep, which the linker counts as "1 skill(s)".
  skills: {
    dirs: [],
    refs: [],
  },
  briefs: {
    dirs: [{ uri: __dirname + '/briefs' }],
  },
  hooks: {
    onBrain: {
      onBoot: [
        {
          command: './node_modules/.bin/rhachet roles boot --role navigator',
          timeout: 'PT30S',
        },
      ],
    },
  },
});
