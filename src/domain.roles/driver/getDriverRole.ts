import { Role } from 'rhachet';

/**
 * .what = driver role definition
 * .why = enables autonomous navigation of thought routes via stone milestones
 */
export const ROLE_DRIVER: Role = Role.build({
  slug: 'driver',
  name: 'Driver',
  purpose: 'navigate thought routes via stone milestones',
  readme: { uri: __dirname + '/readme.md' },
  boot: { uri: __dirname + '/boot.yml' },
  traits: [],
  skills: {
    dirs: [{ uri: __dirname + '/skills' }],
    refs: [],
  },
  briefs: {
    dirs: [{ uri: __dirname + '/briefs' }],
  },
  inits: {
    dirs: [{ uri: __dirname + '/inits' }],
    exec: [
      { cmd: __dirname + '/inits/init.claude.status-line.sh' },
      // .why = a clone that boots with `.route/**` denied cannot add a stone, emit a
      //        yield, or archive a seed — the driver is locked out of the one directory
      //        it exists to tend. this heals that on init, and leaves the real
      //        protection to route.mutate.guard, which can tell a passed stone from an
      //        unpassed one where a path glob cannot.
      { cmd: __dirname + '/inits/init.claude.permissions.route.sh' },
    ],
  },
  hooks: {
    onBrain: {
      onBoot: [
        {
          command: './node_modules/.bin/rhachet roles boot --role driver',
          timeout: 'PT30S',
        },
        {
          command: './node_modules/.bin/rhx route.drive --when hook.onBoot',
          timeout: 'PT5S',
        },
      ],
      onTool: [
        {
          command: './node_modules/.bin/rhx route.bounce --mode hook',
          timeout: 'PT5S',
          filter: {
            what: 'Write|Edit',
            when: 'before',
          },
        },
        {
          command: './node_modules/.bin/rhx route.mutate.guard --mode hook',
          timeout: 'PT5S',
          filter: {
            what: 'Read|Write|Edit|Bash',
            when: 'before',
          },
        },
        {
          command: './node_modules/.bin/rhx route.foreground.guard --mode hook',
          timeout: 'PT5S',
          filter: {
            what: 'Bash',
            when: 'before',
          },
        },
      ],
      onStop: [
        {
          command: './node_modules/.bin/rhx route.drive --when hook.onStop',
          timeout: 'PT5S',
        },
      ],
    },
  },
});
