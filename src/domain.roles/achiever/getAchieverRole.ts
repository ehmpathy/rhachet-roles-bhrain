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
      // onStop: enforce goal triage before session ends
      // halts until all asks are covered by goals
      onStop: [
        {
          command:
            './node_modules/.bin/rhx goal.infer.triage --mode hook.onStop',
          timeout: 'PT10S',
        },
      ],
      // onTalk: implemented via init executable (inits/init.claude.hooks.sh)
      // rhachet's Role.build() only supports onBoot, onTool, onStop
      // the init adds UserPromptSubmit hook directly to settings.json
      // run: npx rhachet roles init --role achiever
    },
  },
});
