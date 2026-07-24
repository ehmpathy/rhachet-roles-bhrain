import { Role } from 'rhachet';

/**
 * .what = learner role definition
 * .why = enables durable retention of knowledge via lesson externalization
 */
export const ROLE_LEARNER: Role = Role.build({
  slug: 'learner',
  name: 'Learner',
  purpose: 'durable retention of knowledge, externalize lessons into briefs',
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
          command: './node_modules/.bin/rhachet roles boot --role learner',
          timeout: 'PT30S',
        },
      ],
      // onTool: halt writes to claude native memory, redirect to durable capture.
      // registered as a skill invoked via `rhx <skill> --mode hook` (same pattern
      // as the driver role's route.bounce) — the memory.guard.sh wrapper captures
      // stdin into RHACHET_STDIN to work around node -e stdin inheritance
      onTool: [
        {
          command: './node_modules/.bin/rhx memory.guard --mode hook',
          timeout: 'PT5S',
          filter: {
            what: 'Write|Edit|Bash',
            when: 'before',
          },
        },
      ],
      // onStop: the domain-term sweephook. nudges the learner to distill its
      // domain.term lessons when the distillation has gone stale (> 1 hour,
      // walltime). it holds the *stop* open (exit 2), never a *write* — same
      // mechanism as the driver's route.drive onStop. read-only staleness check.
      onStop: [
        {
          command:
            './node_modules/.bin/rhx learn.domain.terms --when hook.onStop',
          timeout: 'PT5S',
        },
      ],
    },
  },
});
