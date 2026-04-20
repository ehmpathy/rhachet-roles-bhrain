import { Role } from 'rhachet';

/**
 * .what = achiever role definition
 * .why = enables goal detection, persistence, and triage
 */
export const ROLE_ACHIEVER: Role = Role.build({
  slug: 'achiever',
  name: 'Achiever',
  purpose: 'detect, persist, and triage goals — no ask forgotten',
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
      // onTool: protect .goals/ from direct manipulation
      onTool: [
        {
          command: './node_modules/.bin/rhx goal.guard',
          timeout: 'PT5S',
          filter: {
            what: 'Read|Write|Edit|Bash',
            when: 'before',
          },
        },
      ],
      // onStop: enforce goal triage before session ends
      // halts until all asks are covered by goals
      onStop: [
        {
          command:
            './node_modules/.bin/rhx goal.triage.infer --when hook.onStop',
          timeout: 'PT10S',
        },
        {
          command:
            './node_modules/.bin/rhx goal.triage.next --when hook.onStop',
          timeout: 'PT10S',
        },
      ],
      // onTalk: accumulate asks as they arrive
      onTalk: [
        {
          command:
            './node_modules/.bin/rhx goal.triage.infer --when hook.onTalk',
          timeout: 'PT5S',
        },
      ],
    },
  },
});
