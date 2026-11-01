import { Role } from 'rhachet';

import { MEMORY_GUARD_TOOLS } from '@src/domain.operations/memory/MEMORY_GUARD_TOOLS';

import {
  LEARNER_MEMORY_GUARD_HOOK_BUDGET,
  LEARNER_MEMORY_GUARD_HOOK_COMMAND,
} from './getLearnerRoleHookCommand';

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
      // onTool: halt writes to claude native memory, redirect to durable capture.
      // the command fails open on any guard fault; see LEARNER_MEMORY_GUARD_HOOK_COMMAND
      onTool: [
        {
          command: LEARNER_MEMORY_GUARD_HOOK_COMMAND,
          timeout: LEARNER_MEMORY_GUARD_HOOK_BUDGET,
          filter: {
            what: [
              ...MEMORY_GUARD_TOOLS.file,
              ...MEMORY_GUARD_TOOLS.shell,
            ].join('|'),
            when: 'before',
          },
        },
      ],
    },
  },
});
