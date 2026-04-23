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
  hooks: {
    onBrain: {
      onBoot: [
        {
          command: './node_modules/.bin/rhachet roles boot --role driver',
          timeout: 'PT30S',
        },
        {
          command: './node_modules/.bin/rhx route.drive --mode hook',
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
      ],
      onStop: [
        {
          command: './node_modules/.bin/rhx route.drive --mode hook',
          timeout: 'PT5S',
        },
      ],
    },
  },
});
